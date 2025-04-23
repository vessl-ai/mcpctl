export interface SecretReference {
  // TODO: Source 추가
  key: string; // 시크릿 키 (예: "SLACK_TOKEN")
  description?: string; // 시크릿에 대한 설명 (선택사항)
}
// 이걸 별도 타입으로 관리하는 이유는 나중에 다양한 secret store 를 지원할 때 확장성을 위해서임
export type SharedSecretsConfig = {
  // 공용으로 사용할 시크릿 참조들
  shared: Record<string, SecretReference>;
};
