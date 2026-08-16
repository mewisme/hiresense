import type { Prisma } from '../../../generated/prisma/client';

type ResumeVersionWithFile = Prisma.ResumeVersionGetPayload<{ include: { fileObject: true } }>;

export function toResumeVersionResponse(version: ResumeVersionWithFile) {
  return {
    id: version.id,
    versionNo: version.versionNo,
    fileObjectId: version.fileObjectId,
    createdAt: version.createdAt,
    file: {
      id: version.fileObject.id,
      originalFilename: version.fileObject.originalFilename,
      mimeType: version.fileObject.mimeType,
      sizeBytes: version.fileObject.sizeBytes.toString(),
      sha256: version.fileObject.sha256,
      status: version.fileObject.status,
    },
  };
}