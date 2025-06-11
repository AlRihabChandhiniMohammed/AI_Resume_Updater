import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const form = new formidable.IncomingForm();
  form.uploadDir = '/tmp';
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing form' });

    const username = fields.username as string;
    const file = files.resume;

    if (!username || !file || Array.isArray(file)) {
      return res.status(400).json({ error: 'Missing resume or GitHub username' });
    }

    const filePath = file.filepath;
    const pdfBuffer = fs.readFileSync(filePath);

    // ✅ Validate PDF file
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(pdfBuffer);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid PDF file. Please upload a valid resume.' });
    }

    // Fetch GitHub repos
    const githubRes = await fetch(`https://api.github.com/users/${username}/repos`);
    if (!githubRes.ok) {
      return res.status(404).json({ error: 'GitHub user not found' });
    }
    const repos = await githubRes.json();
    const topProjects = repos.slice(0, 5).map(
      (repo: any) => `• ${repo.name}: ${repo.description || 'No description'}`
    );

    const projectText = ['Projects:', ...topProjects].join('\n');

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const textSize = 12;

    // Draw text below "Projects" header or fallback position
    let yPosition = height - 150;
    try {
      const existingText = (firstPage as any).getTextContent?.() ?? '';
      if (typeof existingText === 'string' && existingText.includes('Projects')) {
        yPosition = height - 200;
      }
    } catch (_) {
      // fallback
    }

    firstPage.drawText(projectText, {
      x: 50,
      y: yPosition,
      size: textSize,
      font,
      color: rgb(0, 0, 0),
      lineHeight: 16,
    });

    const updatedPdf = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=updated_resume.pdf');
    res.send(Buffer.from(updatedPdf));
  });
}
