import { recommendRouting } from '../src/lib/engines/routingEngine';
import { NetworkValidationError } from '../src/lib/errors/NetworkErrors';

describe('Routing Protocol Decision Engine', () => {
  test('recommends Single-Area OSPF for single site with fewer than 50 subnets', () => {
    const res = recommendRouting({
      subnetsCount: 12,
      sitesCount: 1,
      networkType: 'Campus LAN',
      cloudIntegration: false
    });

    expect(res.protocol).toContain('Single-Area OSPF');
    expect(res.architecture).toContain('Single Backbone Area');
    expect(res.rfcReferences[0]).toContain('RFC 2328');
    expect(res.technicalExplanation).toContain('Dijkstra');
  });

  test('recommends Multi-Area OSPF when subnets count reaches or exceeds 50', () => {
    const res = recommendRouting({
      subnetsCount: 52,
      sitesCount: 1,
      networkType: 'Campus LAN',
      cloudIntegration: false
    });

    expect(res.protocol).toContain('Multi-Area OSPF');
    expect(res.summarizationPlan).toContain('summarization');
  });

  test('recommends Multi-Area OSPF for multi-site enterprise without cloud', () => {
    const res = recommendRouting({
      subnetsCount: 10,
      sitesCount: 3,
      networkType: 'Campus LAN',
      cloudIntegration: false
    });

    expect(res.protocol).toContain('Multi-Area OSPF');
    expect(res.areaDesign.length).toBeGreaterThan(1);
  });

  test('recommends Hybrid OSPF + eBGP for Multi-Site WAN with Cloud VPC Integration', () => {
    const res = recommendRouting({
      subnetsCount: 15,
      sitesCount: 4,
      networkType: 'Global WAN',
      cloudIntegration: true,
      externalAsRequired: true
    });

    expect(res.protocol).toContain('Hybrid Routing');
    expect(res.protocol).toContain('eBGP');
    expect(res.rfcReferences.some(r => r.includes('RFC 4271'))).toBe(true);
    expect(res.technicalExplanation).toContain('AS_PATH');
  });

  test('throws NetworkValidationError on invalid subnetsCount', () => {
    expect(() => {
      recommendRouting({ subnetsCount: 0 });
    }).toThrow(NetworkValidationError);

    expect(() => {
      recommendRouting({ subnetsCount: 'invalid' });
    }).toThrow(NetworkValidationError);
  });
});

