import { validateNetworkScenario } from '../validators/networkValidator';
import { recommendMedia } from './mediaEngine';
import { allocateVlsm } from './vlsmEngine';
import { recommendRouting } from './routingEngine';
import { recommendTopology } from './topologyEngine';
import { generateCiscoConfigs } from './configurationEngine';
import { generateAllExplanations } from './explanationEngine';
import { NetworkValidationError } from '../errors/NetworkErrors';

/**
 * NetArchitect Core Orchestrator
 * Integrates all domain engines into an explainable network architecture.
 */
export function planNetwork(scenario) {
  // Step 1: Input Validation
  const validation = validateNetworkScenario(scenario);
  if (!validation.valid) {
    throw new NetworkValidationError(validation.errors.join(' | '), 'scenario', validation.errors);
  }

  // Step 2: Physical Media Recommendation
  const mediaRecommendation = recommendMedia(scenario.distanceMeters, {
    requestedMedium: scenario.requestedMedium,
    targetDataRate: scenario.requestedBandwidth || '10Gbps'
  });

  // Step 3: VLSM Address Subnet Allocation
  const vlsmResult = allocateVlsm(scenario.rootCidr, scenario.departments, {
    allowRfc3021: scenario.allowRfc3021
  });

  // Step 4: Routing Protocol Decision
  const routingRecommendation = recommendRouting({
    subnetsCount: vlsmResult.allocatedSubnets.length,
    sitesCount: scenario.sitesCount || 1,
    networkType: scenario.networkType,
    cloudIntegration: Boolean(scenario.cloudIntegration),
    externalAsRequired: Boolean(scenario.cloudIntegration || scenario.networkType === 'Global WAN')
  });

  // Step 5: Topology Architecture & React Flow Graph
  const topologyRecommendation = recommendTopology({
    endpoints: scenario.endpoints,
    buildingsCount: scenario.buildingsCount || 1,
    sitesCount: scenario.sitesCount || 1,
    redundancy: scenario.redundancy || 'High',
    networkType: scenario.networkType,
    cloudIntegration: Boolean(scenario.cloudIntegration),
    maxDistanceMeters: scenario.distanceMeters,
    departments: scenario.departments,
    allocatedSubnets: vlsmResult.allocatedSubnets
  });

  // Step 6: Cisco IOS Configuration Generation
  const configurations = generateCiscoConfigs({
    networkName: scenario.name,
    networkType: scenario.networkType,
    allocatedSubnets: vlsmResult.allocatedSubnets,
    routingRecommendation,
    topologyRecommendation,
    mediaRecommendation,
    redundancy: scenario.redundancy
  });

  // Step 7: Explainable Decision Engine (25 marks!)
  const explanations = generateAllExplanations({
    networkName: scenario.name,
    networkType: scenario.networkType,
    distance: scenario.distanceMeters,
    mediaRecommendation,
    routingRecommendation,
    topologyRecommendation,
    vlsmResult,
    endpoints: scenario.endpoints,
    buildingsCount: scenario.buildingsCount,
    sitesCount: scenario.sitesCount,
    cloudIntegration: scenario.cloudIntegration,
    qosEnabled: scenario.qosEnabled
  });

  return {
    scenario,
    validationWarnings: validation.warnings,
    media: mediaRecommendation,
    vlsm: vlsmResult,
    routing: routingRecommendation,
    topology: topologyRecommendation,
    configurations,
    explanations: explanations.decisions,
    rawExplanations: explanations,
    timestamp: new Date().toISOString()
  };
}

