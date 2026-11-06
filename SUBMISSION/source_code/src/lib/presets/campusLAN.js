export const campusLANPreset = {
  id: 'campus-lan',
  name: 'Campus LAN Enterprise',
  networkType: 'Campus LAN',
  description: 'Multi-building collegiate/corporate campus network with 3 interconnected buildings, 1,600 endpoints, PoE+ access points, and OM4 fiber backbone.',
  buildingsCount: 3,
  sitesCount: 1,
  endpoints: 1600,
  distanceMeters: 350, // Less than 400m
  requestedBandwidth: '10 Gbps',
  redundancy: 'High',
  poeRequired: true,
  cloudIntegration: false,
  qosEnabled: true,
  rootCidr: '10.10.0.0/20', // 4096 IP addresses
  departments: [
    { name: 'Student & Staff Wi-Fi', hosts: 600, vlanId: 10, description: 'High-density 802.11ax wireless user pool' },
    { name: 'Academic Labs & Workstations', hosts: 400, vlanId: 20, description: 'Computer labs and research desktop systems' },
    { name: 'Faculty & Administration', hosts: 300, vlanId: 30, description: 'Administrative staff and executive offices' },
    { name: 'Campus Data Center & Servers', hosts: 120, vlanId: 40, description: 'Local application, ERP, and storage servers' },
    { name: 'VoIP Telephony & Surveillance', hosts: 100, vlanId: 50, description: 'PoE-powered IP phones and security cameras' },
    { name: 'Network Infrastructure Management', hosts: 50, vlanId: 99, description: 'Switch SVI loopbacks, out-of-band management' }
  ]
};

