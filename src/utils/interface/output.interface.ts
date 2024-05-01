interface PutObjectCommandOutput {
  ETag?: string;
  ServerSideEncryption?: string;
  VersionId?: string;
  SSECustomerAlgorithm?: string;
  SSECustomerKeyMD5?: string;
  SSEKMSKeyId?: string;
  SSEKMSEncryptionContext?: string;
  BucketKeyEnabled?: boolean;
  RequestCharged?: string;
  $metadata: {
    httpStatusCode?: number;
  };
}
