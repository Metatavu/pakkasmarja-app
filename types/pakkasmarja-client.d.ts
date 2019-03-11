export const ChatGroupType: {
  CHAT: string;
  QUESTION: string;
};
export const ChatThread: {
  AnswerTypeEnum: {
    POLL: string;
    TEXT: string;
  };
};
export const Contact: {
  VatLiableEnum: {
    EU: string;
    False: string;
    True: string;
  };
};
export const Contract: {
  StatusEnum: {
    APPROVED: string;
    DRAFT: string;
    ONHOLD: string;
    REJECTED: string;
    TERMINATED: string;
  };
};
export const OperationReportItem: {
  StatusEnum: {
    FAILURE: string;
    PENDING: string;
    SUCCESS: string;
  };
};
export default _default;
export const _default: {
  apiUrl: string;
  configure: Function;
  getChatGroupsService: Function;
  getChatMessagesService: Function;
  getChatThreadsService: Function;
  getContactsService: Function;
  getContractsService: Function;
  getDeliveryPlacesService: Function;
  getItemGroupsService: Function;
  getNewsArticlesService: Function;
  getOperationReportsService: Function;
  getOperationsService: Function;
  getSignAuthenticationServicesService: Function;
};
