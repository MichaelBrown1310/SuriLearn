/**
 * SuriLearn Exercise Contracts & Minigame Interfaces
 * Module 1 - Phishing & Cybersecurity Everyday Defense
 * Strictly adheres to PRD, Suri Identity Manual, and 3-step Pedagogical Feedback.
 */

// ==========================================
// 1. SURI MASCOT VISUAL CONTRACT
// ==========================================

export type SuriPose =
  | 'idle' // Suri standing on two hind legs alert
  | 'victory' // Suri celebrating with OK pose
  | 'error' // Suri sad / defensive pose
  | 'sleeping' // Suri asleep / inactive
  | 'shield' // Suri with laptop cyber sentinel desk
  | 'idea' // Suri thinking with question bubble
  | 'cool' // Suri with sunglasses (SuriPro)
  | 'running' // Suri sprinting in rapid triage mode
  | 'wink' // Suri playful winking eye
  | 'surprised' // Suri startled / alert reaction
  | 'ok'; // Suri giving OK sign

export interface PedagogicalFeedback {
  // Step 1: Empathy with the deception
  empathy: string;
  // Step 2: Technical objective indicator
  technicalIndicator: string;
  // Step 3: Actionable real-world prevention advice
  preventiveTip: string;
}

// ==========================================
// 2. EXERCISE TYPES & BASE INTERFACE
// ==========================================

export type ExerciseType =
  | 'inbox_simulator'
  | 'url_inspector'
  | 'password_builder'
  | 'chat_simulator'
  | 'permission_swipe'
  | 'rapid_triage'
  | 'firewall_arcade'
  | 'network_maze'
  | 'incident_soc'
  | 'code_patcher'
  | 'forensic_investigator'
  | 'cyber_hangman'
  | 'cyber_snake'
  | 'cyber_memory'
  | 'threat_whack';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  title: string;
  instruction: string;
  suriPrompt: string;
  suriPoseInitial: SuriPose;
  feedback: PedagogicalFeedback;
}

// ==========================================
// 3. MINIGAME 1: INBOX THREAT SCANNER
// (`inbox_simulator`)
// ==========================================

export type InboxVerdict = 'phish' | 'safe' | 'verify';

export interface EmailHeader {
  visualSender: string; // e.g., "Recursos Humanos - Nómina Oficial"
  actualSender: string; // e.g., "soporte@banc0-alert.xyz"
  isSenderSpoofed: boolean;
  spfStatus: 'pass' | 'fail' | 'neutral';
  dkimStatus: 'pass' | 'fail';
  replyTo?: string;
  receivedTime: string;
}

export interface EmailBodyLink {
  displayedText: string;
  actualDestinationUrl: string;
  isSuspicious: boolean;
  inspectWarning?: string;
}

export interface EmailAttachment {
  filename: string;
  size: string;
  isSuspicious: boolean;
  inspectWarning?: string;
}

export interface InboxThreatScannerExercise extends BaseExercise {
  type: 'inbox_simulator';
  header: EmailHeader;
  subject: string;
  isUrgentFlag: boolean;
  bodyText: string;
  actionButtonText: string;
  link: EmailBodyLink;
  attachment?: EmailAttachment;
  footnoteWarning?: string;
  correctVerdict: InboxVerdict;
  clues: string[];
}

// ==========================================
// 4. MINIGAME 2: URL INSPECTOR
// (`url_inspector`)
// ==========================================

export type UrlSegmentType = 'protocol' | 'subdomain' | 'root_domain' | 'path';

export interface UrlSegment {
  id: string;
  type: UrlSegmentType;
  text: string;
  isSuspicious: boolean;
  annotation?: string; // Revealed when inspected
}

export interface UrlInspectorExercise extends BaseExercise {
  type: 'url_inspector';
  rawUrl: string;
  segments: UrlSegment[];
  maliciousSegmentId: string;
  attackTechnique:
    | 'typosquatting' // e.g., "banc0" instead of "banco"
    | 'deceptive_subdomain' // e.g., "banco.com.servicios-login.xyz"
    | 'punycode' // e.g., "xn--pple-43d.com"
    | 'insecure_http' // e.g., "http://" for banking
    | 'suspicious_tld'; // e.g., ".xyz", ".top", ".buzz"
  hint: string;
}

// ==========================================
// 5. MINIGAME 3: PASSWORD VAULT BUILDER
// (`password_builder`)
// ==========================================

export type PasswordTokenCategory =
  | 'lowercase'
  | 'uppercase'
  | 'number'
  | 'special_char'
  | 'passphrase_word'
  | 'predictable_pattern';

export interface PasswordToken {
  id: string;
  text: string;
  label: string;
  category: PasswordTokenCategory;
  entropyContributionBits: number;
}

export interface PasswordCrackTimeEstimate {
  years: number;
  displayText: string; // e.g., "Instantáneo", "2 horas", "480 años", "12,000 años"
  strengthScore: number; // 0 to 100
  barColor: string; // e.g., "#EF4444", "#E1A653", "#22C55E"
}

export interface PasswordVaultBuilderExercise extends BaseExercise {
  type: 'password_builder';
  targetCrackYears: number; // Minimum years to crack (e.g., 400)
  minEntropyRequired: number; // e.g., 60 bits
  availableTokens: PasswordToken[];
  contextScenario: string; // e.g., "Protege el acceso a la cuenta bancaria de tu empresa"
}

// ==========================================
// 6. MINIGAME 4: SOCIAL ENGINEERING CHAT
// (`chat_simulator`)
// ==========================================

export interface ChatMessage {
  id: string;
  sender: 'attacker' | 'user' | 'system';
  text: string;
  timestamp: string;
  delayMs?: number;
}

export interface ChatDialogueOption {
  id: string;
  text: string;
  isSafeChoice: boolean;
  isPanicButton?: boolean; // Immediate escalation to security officer
  feedbackImmediate: string;
  nextDialogueNodeId?: string | null;
}

export interface ChatDialogueNode {
  id: string;
  incomingMessages: ChatMessage[];
  options: ChatDialogueOption[];
}

export interface SocialEngineeringChatExercise extends BaseExercise {
  type: 'chat_simulator';
  channel: 'whatsapp' | 'slack' | 'sms';
  attackerContact: {
    displayName: string;
    avatarUrl?: string;
    phoneNumberOrHandle: string;
    allegedRole: string; // e.g., "CEO de la empresa", "Gerente Bancario"
    isVerifiedBadge: boolean; // Fake badge test
  };
  psychologicalTrigger: 'urgency' | 'fear' | 'authority' | 'sympathy';
  rootNodeId: string;
  dialogueNodes: Record<string, ChatDialogueNode>;
}

// ==========================================
// 7. MINIGAME 5: PERMISSION GATEKEEPER
// (`permission_swipe`)
// ==========================================

export type AppPermissionType =
  | 'camera'
  | 'microphone'
  | 'contacts'
  | 'location_precise'
  | 'sms'
  | 'storage'
  | 'accessibility';

export interface AppPermissionItem {
  id: string;
  type: AppPermissionType;
  title: string;
  icon: string;
  isJustifiedForFunction: boolean;
  riskSeverity: 'low' | 'medium' | 'high' | 'critical';
  riskExplanation: string;
}

export interface PermissionGatekeeperExercise extends BaseExercise {
  type: 'permission_swipe';
  appInfo: {
    name: string;
    category: string; // e.g., "Linterna Simple", "Calculadora de Impuestos"
    iconUrl: string;
    statedPurpose: string;
  };
  requestedPermissions: AppPermissionItem[];
  expectedVerdict: 'deny' | 'allow';
}

// ==========================================
// 8. MINIGAME 6: RAPID TRIAGE RADAR
// (`rapid_triage`)
// ==========================================

export interface TriageCard {
  id: string;
  category: 'email' | 'sms' | 'qr_code' | 'push_alert' | 'invoice';
  title: string;
  bodySnippet: string;
  senderSnippet: string;
  isThreat: boolean;
  indicatorText: string;
}

export interface RapidTriageRadarExercise extends BaseExercise {
  type: 'rapid_triage';
  timeLimitSeconds: number; // Strictly 7 seconds per card
  cards: TriageCard[];
  requiredCorrectPass: number; // e.g., 3 out of 3
}

// ==========================================
// 9. VIDEO GAME 7: FIREWALL DEFENSE ARCADE
// (`firewall_arcade`)
// ==========================================

export interface FirewallPacketItem {
  id: string;
  protocolLabel: string; // e.g., "HTTPS :443", "SQLi Payload", "SSH Brute :22"
  sourceIp: string;
  payloadPreview: string;
  lane: 0 | 1 | 2; // 3 lanes (0: Left, 1: Center, 2: Right)
  isMalicious: boolean;
  speedTier: 'normal' | 'fast' | 'boss';
  explanation: string;
}

export interface FirewallDefenseExercise extends BaseExercise {
  type: 'firewall_arcade';
  firewallRuleBanner: string; // e.g., "REGLA ACTIVA: Permite tráfico cifrado (HTTPS :443 / DNS :53) y destruye inyecciones SQL, SSH :22 y Troyanos"
  serverMaxHp: number;
  requiredScoreToWin: number;
  packets: FirewallPacketItem[];
}

// ==========================================
// 10. VIDEO GAME 8: NETWORK MAZE (VPN & MITM)
// (`network_maze`)
// ==========================================

export type MazeCellType =
  | 'empty'
  | 'wall'
  | 'start'
  | 'server_goal'
  | 'vpn_shield'
  | 'mfa_key'
  | 'data_packet'
  | 'sniffer_trap'
  | 'evil_twin_ap';

export interface MazeHazardInfo {
  cellType: 'sniffer_trap' | 'evil_twin_ap' | 'vpn_shield' | 'mfa_key';
  name: string;
  description: string;
}

export interface NetworkMazeExercise extends BaseExercise {
  type: 'network_maze';
  missionObjective: string;
  gridRows: number;
  gridCols: number;
  /**
   * 2D Matrix of cell types (gridRows x gridCols)
   */
  grid: MazeCellType[][];
  requireVpnBeforeGoal: boolean;
  requireMfaBeforeGoal: boolean;
  hazardsLegend: MazeHazardInfo[];
}

// ==========================================
// 11. VIDEO GAME 9: INCIDENT COMMAND SOC
// (`incident_soc`)
// ==========================================

export type SocActionType = 'isolate' | 'revoke_iam' | 'purge_malware' | 'restore_backup';

export interface SocNetworkNode {
  id: string;
  name: string;
  role: string;
  icon: string;
  initialState: 'healthy' | 'infected' | 'compromised_iam' | 'at_risk';
  connectedTo: string[];
  infectionNote: string;
}

export interface IncidentCommandExercise extends BaseExercise {
  type: 'incident_soc';
  threatName: string; // e.g., "Ransomware LockBit-PYME v4"
  scenarioAlert: string;
  maxEncryptionDangerSeconds: number; // e.g., 45 seconds before 100% encryption
  nodes: SocNetworkNode[];
  requiredSequenceHint: string;
}

// ==========================================
// 12. VIDEO GAME 10: DEVSECOPS CODE PATCHER
// (`code_patcher`)
// ==========================================

export interface CodePatchOption {
  id: string;
  label: string;
  codeReplacement: string;
  securityLayer: string; // e.g., "Prepared Statement SQL", "DOMPurify + CSP", "RBAC Token Check"
  isCorrect: boolean;
  explanation: string;
}

export interface CodeExploitWave {
  id: string;
  vulnerabilityName: string; // e.g., "OWASP A03: Inyección SQL (SQLi)"
  endpoint: string; // e.g., "POST /api/v1/login"
  attackerPayload: string; // e.g., "admin' OR '1'='1' --"
  vulnerableCodeLines: string[];
  vulnerableLineIndex: number; // 0-based index in vulnerableCodeLines
  options: CodePatchOption[];
}

export interface CodePatcherExercise extends BaseExercise {
  type: 'code_patcher';
  appName: string;
  waves: CodeExploitWave[];
}

// ==========================================
// 13. VIDEO GAME 11: FORENSIC THREAT HUNTER
// (`forensic_investigator`)
// ==========================================

export interface ForensicProcessArtifact {
  id: string;
  pid: number;
  processName: string;
  signatureStatus: 'signed_microsoft' | 'unsigned_suspicious' | 'spoofed_cert';
  remoteEndpoint: string; // e.g., "185.220.101.9:4444 (C2)" or "Localhost / Sistema"
  cpuUsage: string;
  behaviorAlert: string;
  isMalicious: boolean;
  forensicClue: string;
}

export interface ForensicInvestigatorExercise extends BaseExercise {
  type: 'forensic_investigator';
  hostName: string;
  incidentBrief: string;
  processes: ForensicProcessArtifact[];
  rootCauseQuestion: string;
  rootCauseOptions: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

// ==========================================
// 14. CLASSIC ARCADE GAMES (CURSO 7)
// (`cyber_hangman`, `cyber_snake`, `cyber_memory`, `threat_whack`)
// ==========================================

export interface CyberHangmanRound {
  word: string; // Pure uppercase ASCII A-Z (no spaces/accents)
  category: string;
  clue: string;
  explanation: string;
}

export interface CyberHangmanExercise extends BaseExercise {
  type: 'cyber_hangman';
  maxMistakes: number;
  rounds: CyberHangmanRound[];
}

export interface CyberSnakeExercise extends BaseExercise {
  type: 'cyber_snake';
  gridSize: number;
  targetSafeCount: number;
  initialSpeedMs: number;
  maxShields: number;
  safeLabels: string[];
  malwareLabels: string[];
}

export interface CyberMemoryPair {
  id: string;
  threatLabel: string;
  threatIcon: string;
  defenseLabel: string;
  defenseIcon: string;
  explanation: string;
}

export interface CyberMemoryExercise extends BaseExercise {
  type: 'cyber_memory';
  maxMoves: number;
  pairs: CyberMemoryPair[];
}

export interface ThreatWhackItem {
  label: string;
  icon: string;
  isThreat: boolean;
  tip: string;
}

export interface ThreatWhackExercise extends BaseExercise {
  type: 'threat_whack';
  durationSeconds: number;
  targetHits: number;
  maxMistakes: number;
  spawnPool: ThreatWhackItem[];
}

// ==========================================
// 15. UNIFIED EXERCISE UNION & LESSON RUNTIME
// ==========================================

export type Exercise =
  | InboxThreatScannerExercise
  | UrlInspectorExercise
  | PasswordVaultBuilderExercise
  | SocialEngineeringChatExercise
  | PermissionGatekeeperExercise
  | RapidTriageRadarExercise
  | FirewallDefenseExercise
  | NetworkMazeExercise
  | IncidentCommandExercise
  | CodePatcherExercise
  | ForensicInvestigatorExercise
  | CyberHangmanExercise
  | CyberSnakeExercise
  | CyberMemoryExercise
  | ThreatWhackExercise;

export interface ExerciseResult {
  exerciseId: string;
  exerciseType: ExerciseType;
  isCorrect: boolean;
  heartsDeducted: number;
  timeSpentSeconds: number;
  attemptsCount: number;
}

export interface LessonSessionSummary {
  lessonId: string;
  unitId: string;
  totalExercises: number;
  correctAnswersCount: number;
  mistakesCount: number;
  earnedXp: number;
  earnedBits: number;
  isPerfectScore: boolean;
  heartsRemaining: number;
  streakAppliedMultiplier: number;
  results: ExerciseResult[];
  completedAt: string; // ISO string
}

