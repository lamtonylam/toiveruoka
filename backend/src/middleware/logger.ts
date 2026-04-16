import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'backend.log'),
  {
    flags: 'a',
  }
);

const morganMiddleware = morgan(':method :url :status :response-time ms', {
  stream: accessLogStream,
});

export default morganMiddleware;
