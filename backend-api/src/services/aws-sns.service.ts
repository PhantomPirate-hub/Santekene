
import { SNSClient, CreatePlatformEndpointCommand, PublishCommand } from '@aws-sdk/client-sns';
import dotenv from 'dotenv';

dotenv.config();

class SnsService {
  private snsClient: SNSClient;

  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async sendPushNotification(deviceToken: string, message: string, data: object = {}) {
    try {
      // For simplicity, we'll assume Android for now. In a real app, you'd determine the platform.
      const platformApplicationArn = process.env.AWS_SNS_PLATFORM_APPLICATION_ARN_ANDROID!;

      // Create a platform endpoint
      const createEndpointCommand = new CreatePlatformEndpointCommand({
        PlatformApplicationArn: platformApplicationArn,
        Token: deviceToken,
      });
      const endpointResponse = await this.snsClient.send(createEndpointCommand);
      const endpointArn = endpointResponse.EndpointArn;

      if (!endpointArn) {
        throw new Error('Failed to create SNS endpoint');
      }

      // Create the message payload
      const payload = {
        default: message,
        GCM: JSON.stringify({
          notification: {
            title: 'Santé Kènè',
            body: message,
            sound: 'default',
          },
          data: data,
        }),
      };

      // Publish the message
      const publishCommand = new PublishCommand({
        TargetArn: endpointArn,
        Message: JSON.stringify(payload),
        MessageStructure: 'json',
      });

      await this.snsClient.send(publishCommand);
      console.log(`Push notification sent to ${endpointArn}`);

    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}

export default new SnsService();
