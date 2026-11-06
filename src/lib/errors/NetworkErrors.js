/**
 * Custom Network Error Hierarchy
 */

export class NetworkValidationError extends Error {
  constructor(message, field = null, value = null) {
    super(message);
    this.name = 'NetworkValidationError';
    this.field = field;
    this.value = value;
  }
}

export class PhysicalDistanceViolationError extends NetworkValidationError {
  constructor(message, distance, medium = 'Copper') {
    super(message, 'distance', distance);
    this.name = 'PhysicalDistanceViolationError';
    this.distance = distance;
    this.medium = medium;
  }
}

export class AddressSpaceExhaustionError extends NetworkValidationError {
  constructor(message, requiredAddresses, availableAddresses) {
    super(message, 'rootCidr');
    this.name = 'AddressSpaceExhaustionError';
    this.requiredAddresses = requiredAddresses;
    this.availableAddresses = availableAddresses;
  }
}

export class SubnetAlignmentError extends NetworkValidationError {
  constructor(message, address, requiredPrefix) {
    super(message, 'subnetAddress', address);
    this.name = 'SubnetAlignmentError';
    this.requiredPrefix = requiredPrefix;
  }
}

