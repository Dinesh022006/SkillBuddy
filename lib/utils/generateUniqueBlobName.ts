export function generateUniqueBlobName(originalName: string): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  
  // Clean the original filename to prevent path traversal or weird character issues
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${timestamp}-${uuid}-${cleanName}`;
}
