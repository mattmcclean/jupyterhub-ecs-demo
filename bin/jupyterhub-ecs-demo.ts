#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { JupyterhubEcsDemoStack } from '../lib/jupyterhub-ecs-demo-stack';

const app = new cdk.App();
new JupyterhubEcsDemoStack(app, 'JupyterhubEcsDemoStack');
