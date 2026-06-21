import { big, type Big } from "../core/bignum";

export interface HardwarePowerRate {
  readonly hardwareId: string;
  readonly ratePerLevel: Big;
}

export const HARDWARE_POWER_RATES: readonly HardwarePowerRate[] = [
  { hardwareId: "h_cpu", ratePerLevel: big(2) },
  { hardwareId: "h_ram", ratePerLevel: big(1) },
  { hardwareId: "h_ssd", ratePerLevel: big(0.5) },
  { hardwareId: "h_psu_pc", ratePerLevel: big(1.5) },
  { hardwareId: "h_cooling_pc", ratePerLevel: big(1) },
  { hardwareId: "h_gpu", ratePerLevel: big(4) },
  { hardwareId: "h_rack", ratePerLevel: big(20) },
  { hardwareId: "h_row", ratePerLevel: big(200) },
  { hardwareId: "h_datahall", ratePerLevel: big(2000) },
  { hardwareId: "h_dc_campus", ratePerLevel: big(50000) },
  { hardwareId: "h_dyson_frame", ratePerLevel: big(400000) },
  { hardwareId: "h_srv_board", ratePerLevel: big(80) },
  { hardwareId: "h_srv_psu", ratePerLevel: big(60) },
  { hardwareId: "h_srv_cooling", ratePerLevel: big(70) },
  { hardwareId: "h_srv_net", ratePerLevel: big(50) },
  { hardwareId: "h_blade", ratePerLevel: big(120) },
  { hardwareId: "h_gpu_pod", ratePerLevel: big(600) },
  { hardwareId: "h_dc_module", ratePerLevel: big(2000) },
  { hardwareId: "h_accel_array", ratePerLevel: big(8000) },
  { hardwareId: "h_photonic_rack", ratePerLevel: big(25000) },
  { hardwareId: "h_quantum_node", ratePerLevel: big(70000) },
  { hardwareId: "h_neuromorphic", ratePerLevel: big(140000) },
  { hardwareId: "h_exotic_core", ratePerLevel: big(260000) }
] as const;
