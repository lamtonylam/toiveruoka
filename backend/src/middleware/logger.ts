import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

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
