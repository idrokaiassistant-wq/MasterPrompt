# Add Chat ID to Railway Server Configuration

## 1. Configure Chat ID
- Add `MONITORING_CHAT_ID` environment variable with value `8250501153` to Railway
- Enable monitoring by setting `MONITORING_ENABLED=true`

## 2. Verify Configuration
- Verify environment variables are set correctly using `railway variables`
- Check if Telegram bot token is already configured (confirmed: `8323444021:AAEpqOgxYTq6KDXizQJNYANR1fbDRIGNHCA`)

## 3. Test Connection
- Run alert system test script to verify bot can send messages to the new Chat ID
- Verify health check script functionality with the new configuration

## 4. Monitor Logs
- Check application logs to confirm successful configuration update
- Verify monitoring system startup

This plan ensures the Chat ID is correctly added to the server configuration and validated through testing.