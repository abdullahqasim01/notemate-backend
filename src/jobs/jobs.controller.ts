import { Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { JobProcessorService } from './job-processor.service';
import { Public } from '../auth/public.decorator';

@Controller('jobs')
export class JobsController {
    private readonly logger = new Logger(JobsController.name);

    constructor(private readonly jobProcessorService: JobProcessorService) { }

    @Post('trigger')
    @Public()
    @HttpCode(HttpStatus.OK)
    async triggerJobs() {
        this.logger.log('Manual job trigger received');
        // We don't await this because we want to return quickly to the caller (e.g. Cloud Scheduler)
        // while the processing happens in the background.
        // However, for Cloud Run, it's often better to await if we want to ensure CPU is allocated
        // during the processing. But processJobs handles multiple jobs.
        // Let's await it to ensure the instance stays alive during the check/processing cycle.
        await this.jobProcessorService.processJobs();
        return { message: 'Job processing triggered' };
    }
}
