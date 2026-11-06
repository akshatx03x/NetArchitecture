import { planNetwork } from '../src/lib/engines/networkEngine';
import { campusLANPreset } from '../src/lib/presets/campusLAN';
import { metroMANPreset } from '../src/lib/presets/metroMAN';
import { globalWANPreset } from '../src/lib/presets/globalWAN';

describe('Preset Profile Validation & End-to-End Execution', () => {
  test('executes Profile 1: Campus LAN preset without errors', () => {
    const result = planNetwork(campusLANPreset);

    expect(result.media.mediaType).toContain('OM4');
    expect(result.media.transceiver).toContain('10GBASE-SR');
    expect(result.routing.protocol).toContain('Single-Area OSPF');
    expect(result.vlsm.allocatedSubnets.length).toBe(6);
    expect(result.configurations.coreSwitch.content).toContain('10.10.0.0');
    expect(result.explanations.length).toBeGreaterThanOrEqual(5);
  });

  test('executes Profile 2: Metro MAN preset without errors', () => {
    const result = planNetwork(metroMANPreset);

    expect(result.media.mediaType).toContain('OS2 Single-Mode');
    expect(result.media.transceiver).toContain('10GBASE-ER');
    expect(result.vlsm.allocatedSubnets.length).toBe(6);
    expect(result.topology.topologyTier).toContain('Metro MAN');
    // Ensure QoS / Latency explanation is generated with fiber propagation math
    const qosExp = result.explanations.find(e => e.id === 'decision-qos');
    expect(qosExp).toBeDefined();
    expect(qosExp.mathematicalCalculation).toContain('RTT');
  });

  test('executes Profile 3: Global WAN preset without errors', () => {
    const result = planNetwork(globalWANPreset);

    expect(result.media.mediaType).toContain('OS2 Single-Mode');
    expect(result.routing.protocol).toContain('Hybrid Routing');
    expect(result.routing.protocol).toContain('eBGP');
    expect(result.topology.topologyTier).toContain('WAN');
    expect(result.configurations.edgeRouter.content).toContain('router bgp');
    // Ensure cloud & security explanation is generated
    const cloudExp = result.explanations.find(e => e.id === 'decision-security-cloud');
    expect(cloudExp).toBeDefined();
  });
});

