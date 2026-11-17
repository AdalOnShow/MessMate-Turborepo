import { Logger } from '@nestjs/common';

// Services log every step; keep test output readable.
Logger.overrideLogger(false);
