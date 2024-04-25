export class ClientsDto {
  userId?: number; // 선택적 필드
  clientId: string;
  pushToken?: string; // 선택적 필드
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
