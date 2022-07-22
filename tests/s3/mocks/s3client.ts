import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';

export const mockS3Client = mockClient(S3Client);

mockS3Client.on(CreateMultipartUploadCommand).resolves({ UploadId: '1' });
mockS3Client.on(UploadPartCommand).resolves({ ETag: '1' });
