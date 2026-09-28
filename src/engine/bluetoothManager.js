// Web Bluetooth API wrapper with graceful degradation
export class BluetoothManager {
  static isSupported() {
    return typeof navigator !== 'undefined' &&
      typeof navigator.bluetooth !== 'undefined' &&
      typeof navigator.bluetooth.requestDevice === 'function';
  }

  async requestDevice() {
    if (!BluetoothManager.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser.');
    }
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: []
    });
    if (!device) throw new Error('No device selected.');
    return device;
  }

  async connect(device) {
    if (!device || !device.gatt) {
      throw new Error('GATT not available on this device.');
    }
    return await device.gatt.connect();
  }

  async disconnect(device) {
    try {
      if (device && device.gatt && device.gatt.connected) {
        device.gatt.disconnect();
      }
    } catch (_) { /* ignore */ }
  }
}
