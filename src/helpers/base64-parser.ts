export default async function parseBase64(data: string): Promise<string> {
  try {
    const cleanedBase64String = data.replace(/\n/g, '');
    const decodedBuffer = Buffer.from(cleanedBase64String, 'base64');
    const decodedString = decodedBuffer.toString('utf-8');

    return decodedString;
  } catch (err) {
    console.error(err.message);
    return '';
  }
}
