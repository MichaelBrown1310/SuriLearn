/**
 * Suri Mascot Asset Mapping Helper
 * Uses official transparent-background PNGs from the local /Suri directory.
 */

import { SuriPose } from '../types/exercises';
import suriIdlePng from '../../Suri/Suri_pose_ParadoAlegre.png';
import suriErrorPng from '../../Suri/Suri_pose_TristeSentado.png';
import suriSleepingPng from '../../Suri/Suri_pose_AcostadoDurmiendo.png';
import suriShieldPng from '../../Suri/Suri_pose_SentadoConLaptop.png';
import suriIdeaPng from '../../Suri/Suri_pose_PensandoInterrogacion.png';
import suriCoolPng from '../../Suri/Suri_pose_ParadGafasDeSol.png';
import suriRunningPng from '../../Suri/Suri_pose_Corriendo.png';
import suriWinkPng from '../../Suri/Suri_pose_guiñandoOjo.png';
import suriSurprisedPng from '../../Suri/Suri_pose_ParadoAsombrado.png';
import suriOkPng from '../../Suri/Suri_pose_ParadoSeñaDeOK.png';

export const SURI_IMAGES: Record<SuriPose, string> = {
  idle: suriIdlePng,
  victory: suriOkPng,
  error: suriErrorPng,
  sleeping: suriSleepingPng,
  shield: suriShieldPng,
  idea: suriIdeaPng,
  cool: suriCoolPng,
  running: suriRunningPng,
  wink: suriWinkPng,
  surprised: suriSurprisedPng,
  ok: suriOkPng,
};

export function getSuriImage(pose: SuriPose): string {
  return SURI_IMAGES[pose] || SURI_IMAGES.idle;
}
