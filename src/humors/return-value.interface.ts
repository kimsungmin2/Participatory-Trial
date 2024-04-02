interface HumorBoardReturnValue {
  statusCode: number;
  message: string;
  data?: any;
  boardType?: string;
  pageCount?: number;
  currentPage?: number;
}
