#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { JupyterhubEcsStack } from '../lib/jupyterhub-ecs-stack';

const app = new cdk.App();
new JupyterhubEcsStack(app, 'JupyterhubEcsStack');

