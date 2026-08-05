const z = require('zod');

const VALID_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'text/plain', 'application/zip', 'application/x-zip-compressed'
];

const MAX_SIZES = {
  image: 10 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  zip: 50 * 1024 * 1024,
};

const attachmentSchema = z.object({
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string().refine(val => VALID_FILE_TYPES.includes(val), { message: "Invalid file type" }),
  fileSize: z.number().refine(val => val > 0, { message: "File cannot be empty" }),
  url: z.string().url(),
  thumbnailUrl: z.string().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  duration: z.number().optional().nullable(),
}).refine(data => {
  if (data.mimeType.startsWith('image/')) return data.fileSize <= MAX_SIZES.image;
  if (data.mimeType.includes('zip')) return data.fileSize <= MAX_SIZES.zip;
  return data.fileSize <= MAX_SIZES.document;
}, { message: "File size exceeds limit" });

const messageSchema = z.object({
  content: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
}).refine(data => (data.content && data.content.trim().length > 0) || (data.attachments && data.attachments.length > 0), {
  message: "Message must contain either text content or at least one attachment",
});

const sample = {
  content: "",
  attachments: [{
    url: "https://example.com/blob",
    fileName: "123-abc-test.png",
    originalName: "test.png",
    mimeType: "image/png",
    fileSize: 1024,
    thumbnailUrl: "https://example.com/blob"
  }]
};

try {
  messageSchema.parse(sample);
  console.log("Validation PASS");
} catch(e) {
  console.log("Validation FAIL", JSON.stringify(e.errors, null, 2));
}
