export const metroMANPreset = {
  id: 'metro-man',
  name: 'Metro Financial Colocation MAN',
  networkType: 'Metro MAN',
  description: 'Metropolitan Area Network connecting Financial HQ to two remote offices over 15–35 km carrier EVPL links with OS2 fiber, dual-homed failover, and sub-5ms low latency SLA target.',
  buildingsCount: 3,
  sitesCount: 3,
  endpoints: 450,
  distanceMeters: 28000, // 28 km (15-35 km range)
  requestedBandwidth: '10 Gbps',
  redundancy: 'Dual-Homed',
  poeRequired: true,
  cloudIntegration: false,
  qosEnabled: true,
  rootCidr: '172.20.0.0/21', // 2048 IP addresses
  departments: [
    { name: 'HQ Low-Latency Trading Desk', hosts: 180, vlanId: 10, description: 'Direct market access financial traders' },
    { name: 'Remote Office 1 (Fintech Ops)', hosts: 120, vlanId: 20, description: 'Compliance, risk analytics, and client support' },
    { name: 'Remote Office 2 (Operations & DR)', hosts: 80, vlanId: 30, description: 'Disaster recovery and developer engineering' },
    { name: 'Colocation Secure Financial Core', hosts: 40, vlanId: 40, description: 'Proprietary algorithmic execution servers' },
    { name: 'Real-time Market Feeds & Voice', hosts: 25, vlanId: 50, description: 'Multicast market data and VoIP dealer turrets' },
    { name: 'Out-of-Band Network Operations', hosts: 12, vlanId: 99, description: 'Encrypted management network and console servers' }
  ]
};

