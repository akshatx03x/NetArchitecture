import {
  PhysicalDistanceViolationError,
  NetworkValidationError
} from '../errors/NetworkErrors';

/**
 * Physical Media & Transceiver Decision Engine
 * Deterministic recommendation engine based on distance, data rate, and medium constraints.
 */
export function recommendMedia(distanceInMeters, options = {}) {
  const {
    requestedMedium = null, // 'Copper', 'Fiber', null (auto)
    targetDataRate = '10Gbps',
    environment = 'Commercial/Enterprise',
    isOutdoor = false,
  } = options;

  if (distanceInMeters === undefined || distanceInMeters === null || isNaN(Number(distanceInMeters))) {
    throw new NetworkValidationError('Distance must be a valid non-negative number in meters.', 'distance', distanceInMeters);
  }

  const distance = Number(distanceInMeters);
  if (distance < 0) {
    throw new NetworkValidationError(`Distance cannot be negative. Received: ${distance}m`, 'distance', distance);
  }

  // Engineering Check: If user explicitly requested Copper for > 100m, throw PhysicalDistanceViolationError
  if (requestedMedium && requestedMedium.toLowerCase() === 'copper' && distance > 100) {
    throw new PhysicalDistanceViolationError(
      `Physical Distance Violation: Copper twisted-pair (Cat6a / 10GBASE-T) is limited to 100 meters per IEEE 802.3an / ANSI/TIA-568 standards due to signal attenuation, insertion loss, and alien crosstalk. Requested distance is ${distance}m.`,
      distance,
      'Copper'
    );
  }

  let mediaType = '';
  let transceiver = '';
  let standard = '';
  let threshold = '';
  let wavelength = '';
  let connector = '';
  let technicalReason = '';
  let opticalBudget = null;
  let assumptions = [];
  let limitations = [];
  let alternativesRejected = [];

  if (distance <= 100) {
    // 0 - 100m: Cat6a / 10GBASE-T
    mediaType = 'Category 6A UTP/STP (Copper)';
    transceiver = '10GBASE-T RJ-45 PHY / SFP+ Copper Transceiver';
    standard = 'IEEE 802.3an (10GBASE-T) / ANSI/TIA-568-C.2';
    threshold = 'Up to 100m (Standard Horizontal Cabling)';
    wavelength = 'Electrical (baseband signaling up to 500 MHz)';
    connector = '8P8C (RJ-45)';
    technicalReason = `For link distances up to 100m (${distance}m requested), Cat6a copper cabling provides high-performance 10Gbps throughput at lowest initial cost, directly integrating with standard RJ-45 switchports without expensive optical transceivers.`;
    assumptions = [
      'Maximum 90m solid horizontal permanent link plus 10m combined stranded patch cords.',
      'Alien Near-End Crosstalk (ANEXT) mitigated through proper Cat6a shielding and pair separation.',
      'PoE/PoE+ (802.3at/bt) supported for endpoint access switches.'
    ];
    limitations = [
      'Hard 100-meter maximum channel length; cannot be extended without active repeaters or switches.',
      'Higher latency (~2-4 µs per hop) and higher switchport power consumption (2.5W - 5W per port) compared to SFP+ optics (~0.5W).'
    ];
    alternativesRejected = [
      {
        technology: 'OM4 Multimode Fiber',
        reason: 'Unnecessary expense for transceiver optics and fiber termination for short desktop/switch runs under 100m where Cat6a is fully compliant.'
      },
      {
        technology: 'Cat5e / Cat6',
        reason: 'Cat5e is limited to 1G/2.5G at 100m; Cat6 only supports 10Gbps up to 37-55m in benign crosstalk environments, risking link degradation.'
      }
    ];
  } else if (distance <= 400) {
    // 101m - 400m: OM4 MMF / 10GBASE-SR
    mediaType = 'OM4 Laser-Optimized Multimode Fiber (MMF 50/125 µm)';
    transceiver = '10GBASE-SR SFP+ (850nm Short Reach)';
    standard = 'IEEE 802.3ae (10GBASE-SR) / ISO/IEC 11801 OM4';
    threshold = '101m – 400m (Short-Range Building Backbone)';
    wavelength = '850 nm (VCSEL Laser)';
    connector = 'LC Duplex';
    technicalReason = `For distances between 101m and 400m (${distance}m requested), OM4 50/125 µm Multimode Fiber with 10GBASE-SR transceivers provides low-loss optical interconnectivity. OM4 features an effective modal bandwidth (EMB) of 4700 MHz·km at 850nm, supporting 10Gbps transmissions up to 400m.`;
    const distanceKm = distance / 1000;
    const fiberLossDbPerKm = 3.0; // 850nm typical OM4 attenuation
    const fiberLossDb = Number((distanceKm * fiberLossDbPerKm).toFixed(3));
    const connectorLossDb = 0.75; // 2 mated LC connector pairs (~0.375 dB each)
    const spliceLossDb = 0.1; // 1 fusion splice allowance
    const totalChannelLossDb = Number((fiberLossDb + connectorLossDb + spliceLossDb).toFixed(3));
    const txPowerMinDbm = -7.3; // 10GBASE-SR IEEE 802.3ae minimum launch power
    const rxSensitivityDbm = -9.9; // 10GBASE-SR IEEE 802.3ae maximum receiver sensitivity
    const totalPowerBudgetDb = Number((txPowerMinDbm - rxSensitivityDbm).toFixed(2)); // 2.6 dB
    const calculatedMarginDb = Number((totalPowerBudgetDb - totalChannelLossDb).toFixed(3));

    opticalBudget = {
      distanceKm,
      txPowerMinDbm,
      rxSensitivityDbm,
      totalBudgetDb: totalPowerBudgetDb,
      totalPowerBudgetDb,
      fiberAttenuationDbPerKm: fiberLossDbPerKm,
      fiberLossDb,
      connectorLossDb,
      spliceLossDb,
      totalChannelLossDb,
      calculatedMarginDb,
      isFeasible: calculatedMarginDb >= 0
    };
    assumptions = [
      'High-quality 850nm Vertical-Cavity Surface-Emitting Lasers (VCSEL) used in SFP+ optics.',
      'Connector insertion losses strictly kept below 0.75 dB combined total.',
      'Internal campus/building riser or duct installation.'
    ];
    limitations = [
      'Modal dispersion limits bandwidth at longer distances; cannot be extended beyond 400m for 10Gbps (or beyond 100m for 40G/100G without MPO parallel optics).',
      'Requires delicate bend radius management and LC fiber optic patch panels.'
    ];
    alternativesRejected = [
      {
        technology: 'Cat6a Copper',
        reason: `Exceeds the 100m physical channel limit by ${distance - 100}m; violates IEEE 802.3an attenuation limits.`
      },
      {
        technology: 'OS2 Single-Mode Fiber',
        reason: 'Functionally capable but single-mode transceivers (10GBASE-LR) are significantly more expensive than 10GBASE-SR optics for links under 400m.'
      }
    ];
  } else {
    // Above 400m: OS2 SMF / Appropriate Optical Interface
    mediaType = 'OS2 Single-Mode Fiber (SMF 9/125 µm)';
    threshold = 'Above 400m (Campus Inter-Building & Long-Haul MAN/WAN)';
    connector = 'LC Duplex (or SC/APC for Carrier Telco Hand-off)';

    const distanceKm = distance / 1000;
    let txPowerMinDbm = 0;
    let rxSensitivityDbm = 0;
    let totalBudgetDb = 0;
    let attenuationDbPerKm = 0.4;
    let connectorLossDb = 1.0;
    let spliceLossDb = 0.2;

    if (distance <= 10000) {
      // Up to 10 km
      transceiver = '10GBASE-LR SFP+ (1310nm Long Reach DFB Laser)';
      standard = 'IEEE 802.3ae (10GBASE-LR) / ITU-T G.652.D';
      wavelength = '1310 nm (Distributed Feedback Laser)';
      txPowerMinDbm = -8.2;
      rxSensitivityDbm = -14.4;
      totalBudgetDb = Number((txPowerMinDbm - rxSensitivityDbm).toFixed(2)); // 6.2 dB
      attenuationDbPerKm = 0.4; // 1310nm single-mode attenuation
      connectorLossDb = 1.0; // 2 patch connections
      spliceLossDb = 0.2;
    } else if (distance <= 40000) {
      // 10 km to 40 km
      transceiver = '10GBASE-ER SFP+ (1550nm Extended Reach Laser)';
      standard = 'IEEE 802.3ae (10GBASE-ER) / ITU-T G.652.D';
      wavelength = '1550 nm (EML Laser)';
      txPowerMinDbm = -4.7;
      rxSensitivityDbm = -15.8;
      totalBudgetDb = Number((txPowerMinDbm - rxSensitivityDbm).toFixed(2)); // 11.1 dB
      attenuationDbPerKm = 0.25; // 1550nm single-mode attenuation
      connectorLossDb = 1.5;
      spliceLossDb = 0.5;
    } else {
      // Above 40 km (up to 80 km)
      transceiver = '10GBASE-ZR SFP+ (1550nm Cooled EML / APD Receiver)';
      standard = 'Industry Standard SFF-8431 / Multi-Source Agreement (MSA)';
      wavelength = '1550 nm (Cooled Narrow-Linewidth Laser)';
      txPowerMinDbm = 0.0;
      rxSensitivityDbm = -24.0;
      totalBudgetDb = Number((txPowerMinDbm - rxSensitivityDbm).toFixed(2)); // 24.0 dB
      attenuationDbPerKm = 0.22; // 1550nm low-attenuation window
      connectorLossDb = 2.0;
      spliceLossDb = 1.0;
    }

    const fiberLossDb = Number((distanceKm * attenuationDbPerKm).toFixed(3));
    const totalChannelLossDb = Number((fiberLossDb + connectorLossDb + spliceLossDb).toFixed(3));
    const calculatedMarginDb = Number((totalBudgetDb - totalChannelLossDb).toFixed(3));

    opticalBudget = {
      distanceKm,
      txPowerMinDbm,
      rxSensitivityDbm,
      totalBudgetDb,
      totalPowerBudgetDb: totalBudgetDb,
      fiberAttenuationDbPerKm: attenuationDbPerKm,
      fiberLossDb,
      connectorLossDb,
      spliceLossDb,
      totalChannelLossDb,
      calculatedMarginDb,
      isFeasible: calculatedMarginDb >= 0
    };

    technicalReason = `For link distances above 400m (${distance >= 1000 ? (distance / 1000).toFixed(1) + ' km' : distance + ' m'} requested), OS2 Single-Mode Fiber (9/125 µm core) eliminates modal dispersion entirely. Core diameter permits only a single fundamental transverse optical mode, enabling high-bandwidth transmission over tens of kilometers. Interface "${transceiver}" was selected to guarantee optical link margin over the required span.`;

    assumptions = [
      'Low water-peak ITU-T G.652.D single-mode fiber infrastructure.',
      'Optical attenuation calculated at 1310nm (~0.35-0.4 dB/km) or 1550nm (~0.22-0.25 dB/km).',
      'Receiver optical power monitored via SFP+ Digital Optical Monitoring (DOM / SFF-8472) to prevent receiver saturation.'
    ];
    limitations = [
      'Single-mode laser transceivers generate higher thermal dissipation and carry a higher cost per optic than multimode optics.',
      'Slightly higher installation precision and clean-splice verification required.'
    ];
    alternativesRejected = [
      {
        technology: 'OM4 Multimode Fiber',
        reason: `Exceeds the 400m modal dispersion limit of OM4 10GBASE-SR by ${distance - 400}m; severe pulse spreading causes bit error rate (BER) collapse.`
      },
      {
        technology: 'Cat6a Copper',
        reason: `Exceeds the 100m copper channel limit by ${distance - 100}m.`
      }
    ];
  }

  return {
    distanceMeters: distance,
    distanceDisplay: distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`,
    mediaType,
    transceiver,
    standard,
    threshold,
    wavelength,
    connector,
    technicalReason,
    opticalBudget,
    assumptions,
    limitations,
    alternativesRejected
  };
}

