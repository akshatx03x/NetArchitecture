export const globalWANPreset = {
  id: 'global-wan',
  name: 'Global Multi-Cloud WAN & IoT',
  networkType: 'Global WAN',
  description: 'Intercontinental enterprise WAN connecting 4 global city hubs, Cloud VPC integration, and 2,000 IoT devices/scanners using IPsec VPN, eBGP, and multi-area OSPF.',
  buildingsCount: 6,
  sitesCount: 4,
  endpoints: 2000,
  distanceMeters: 6200000, // 6,200 km global inter-city distance
  requestedBandwidth: '10 Gbps',
  redundancy: 'High',
  poeRequired: true,
  cloudIntegration: true,
  qosEnabled: true,
  rootCidr: '10.100.0.0/19', // 8192 IP addresses
  departments: [
    { name: 'Americas Hub & Automated Scanners', hosts: 800, vlanId: 10, description: 'Warehouse barcode scanners and handling automation' },
    { name: 'EMEA Logistics Operations', hosts: 500, vlanId: 20, description: 'Regional distribution center and ERP endpoints' },
    { name: 'APAC Automated Sorting Depot', hosts: 400, vlanId: 30, description: 'Robotics control systems and packaging terminals' },
    { name: 'Global IoT Telemetry Sensors', hosts: 250, vlanId: 40, description: 'Asset tracking sensors and climate monitors' },
    { name: 'Cloud VPC Hybrid Services', hosts: 100, vlanId: 50, description: 'Direct Connect hybrid microservices and data pipelines' },
    { name: 'Global WAN Infrastructure Management', hosts: 30, vlanId: 99, description: 'BGP edge routers, SD-WAN controllers, IPsec gateways' }
  ]
};

