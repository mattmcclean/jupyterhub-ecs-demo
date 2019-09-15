import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import ssm = require('@aws-cdk/aws-ssm');
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import path = require('path');
import iam = require('@aws-cdk/aws-iam');

export class JupyterhubEcsStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC for the ECS tasks
    const vpc = new ec2.Vpc(this, 'JupyterHubVpc', { maxAzs: 2, natGateways: 1 });

    // create the ECS Cluster
    const cluster = new ecs.Cluster(this, "JupyterHubCluster", {
      vpc: vpc
    });

    // create a task definition with CloudWatch Logs
    const notebookLogging = new ecs.AwsLogDriver({
      streamPrefix: "notebook",
    });

    // Create the Task Definition for the notebook tasks
    const notebookTaskDef = new ecs.FargateTaskDefinition(this, "NotebookTaskDefinition", {
      memoryLimitMiB: 512,
      cpu: 256,
    });
    
    // Add a container to the notebook task
    const nbContainer = notebookTaskDef.addContainer("NotebookContainer", {
      image: ecs.ContainerImage.fromRegistry("jupyter/minimal-notebook"),
      logging: notebookLogging,
      command: [ "jupyterhub-singleuser" ],
      environment: {
        JUPYTERHUB_API_TOKEN: "267a1b3d8b28ddb6fee7063fb2c68001d1a4829df70d766dd2502c33bd92e615",
        JUPYTERHUB_CLIENT_ID: "whoami-oauth-client-test",
      }
    })

    // add the port mappings for the notebook task
    nbContainer.addPortMappings({ containerPort: 8888, hostPort: 8888 });

    // create a security group for the notebook task
    const notebookSecurityGroup = new ec2.SecurityGroup(this, 'NBSecurityGroup', { 
      description:  'SecurityGroup  for the notebook servers',
      vpc,
    });

    // create a Log Driver for the notebook task
    const hubLogging = new ecs.AwsLogDriver({
      streamPrefix: "jupyterhub",
    });

    // define the JupyterHub service
    const hubTaskDef = new ecs.FargateTaskDefinition(this, "HubTaskDefinition", {
      memoryLimitMiB: 512,
      cpu: 256,
    });
    hubTaskDef.taskRole.addToPolicy(new iam.PolicyStatement({resources: ['*'],actions: ['ecs:RunTask', 'ecs:StopTask', 'ecs:DescribeTask', 'ec2:DescribeNetworkInterfaces']}));

    // Create a container for the JupyterHub service
    const hubContainer = hubTaskDef.addContainer("HubContainer", {
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, '..', 'docker')),
      logging: hubLogging,
      command: [ "jupyterhub" ],
      environment: {
        ECS_CLUSTER: cluster.clusterName,
        TASK_DEF_ARN: notebookTaskDef.taskDefinitionArn,
        AWS_REGION: cdk.Stack.of(this).region,
        TASK_SUBNETS: vpc.privateSubnets.map(s=> s.subnetId).join(','),
        TASK_SECURITY_GROUP: notebookSecurityGroup.securityGroupId,
        JUPYTERHUB_API_TOKEN: "267a1b3d8b28ddb6fee7063fb2c68001d1a4829df70d766dd2502c33bd92e615",
        JUPYTERHUB_CLIENT_ID: "whoami-oauth-client-test",    
      }
    })

    // Create the JupyterHub port mappings
    hubContainer.addPortMappings({ containerPort: 8000, hostPort: 8000 });
    hubContainer.addPortMappings({ containerPort: 8081, hostPort: 8081 });

    // Create the JupyterHub service
    const hubService = new ecs.FargateService(this, "JupyterHubService", {
      cluster,
      taskDefinition: hubTaskDef,
      assignPublicIp: true,
      vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
    });

    // Add security group connections between the notebook and hub security groups
    hubService.connections.allowFromAnyIpv4(new ec2.Port({ fromPort: 8000, toPort: 8000, protocol: ec2.Protocol.TCP, stringRepresentation: 'Allow from world'}));
    notebookSecurityGroup.connections.allowFrom(hubService, new ec2.Port({ fromPort: 8888, toPort: 8888, protocol: ec2.Protocol.TCP, stringRepresentation: 'Allow from hub'}));
    hubService.connections.allowFrom(notebookSecurityGroup, new ec2.Port({ fromPort: 8081, toPort: 8081, protocol: ec2.Protocol.TCP, stringRepresentation: 'Allow from notebooks'}));
  }
}