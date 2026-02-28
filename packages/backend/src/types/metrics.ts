export interface ServiceMetrics {
  serviceId: string;
  inDegree: number;
  outDegree: number;
  totalDegree: number;
  betweenness: number;
  pageRank: number;
}

export interface GraphMetrics {
  services: ServiceMetrics[];
}

export interface BlastRadiusResult {
  serviceId: string;
  affectedServiceIds: string[];
  affectedCount: number;
  blastRadius: number;
}

export interface GodServiceResult {
  serviceId: string;
  betweenness: number;
  crossDomainEdgeCount: number;
}

export interface CycleRiskScore {
  componentSize: number;
  crossDomainFactor: number;
  riskScore: number;
}

export interface CircularDependency {
  serviceIds: string[];
  size: number;
  crossDomain: boolean;
  cycleRisk: CycleRiskScore;
}

export type DomainHealthStatus = 'healthy' | 'at-risk' | 'fragile';

export interface DomainHealthComponents {
  couplingRatio: number;
  centralizationFactor: number;
  avgBlastRadius: number;
}

export interface DomainHealthScore {
  domainId: string;
  score: number;
  status: DomainHealthStatus;
  components: DomainHealthComponents;
  serviceCount: number;
}

export interface ImpactedService {
  serviceId: string;
  serviceName: string;
  teamId: string | null;
  domainId: string | null;
  centrality: number;
}

export interface SuggestedStakeholder {
  teamId: string;
  teamName: string;
  memberId: string | null;
  memberName: string | null;
  email: string | null;
  role: string | null;
}

export interface ChangeImpactAnalysis {
  serviceId: string;
  changeType: string;
  affectedCount: number;
  affectedServices: ImpactedService[];
  affectedTeamIds: string[];
  affectedDomainIds: string[];
  avgCentrality: number;
  crossDomainFactor: number;
  riskScore: number;
  stakeholders: SuggestedStakeholder[];
}
