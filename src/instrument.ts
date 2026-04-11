import tracer from 'dd-trace';

if (process.env['DD_TRACE_ENABLED'] !== 'false') {
  tracer.init({
    logInjection: true,
  });
}

export default tracer;
