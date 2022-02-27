An intro on youtube https://www.youtube.com/watch?v=2FPNb1XECGs

Paste the below code in a browser, hit enter then grab the "code" part from the resulting url. 
(The page displayed may look like an error) [REPLACE_WITH_YOUR_CLIENT_ID]

URL T.RUN
https://www.strava.com/oauth/authorize?client_id=[REPLACE_WITH_YOUR_CLIENT_ID]&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=read_all,profile:read_all,activity:read_all,activity:write

Resulting URL
http://localhost/exchange_token?state=&code=[REPLACE_WITH_YOUR_AUTHORIZATION_CODE]&scope=read,activity:write,activity:read_all,profile:read_all,read_all

Exchange the 40 character code from the resulting url in the above step for access token & refresh token
Post this in Postman:
https://www.strava.com/oauth/token?client_id=63547&client_secret=[REPLACE_WITH_YOUR_CLIENT_SECRET]&code=[REPLACE_WITH_YOUR_AUTHORIZATION_CODE]&grant_type=authorization_code

Now you have what you need. 
Continue if you want to test:

View your activities using the access token just received.
Get with this URL in Postman:
https://www.strava.com/api/v3/athlete/activities?access_token=[REPLACE_WITH_YOUR_ACCESS_TOKEN_SECRET]

Use refresh token to get new access tokens.
Post with this URL in Postman:
https://www.strava.com/oauth/token?client_id=49217&client_secret=[REPLACE_WITH_YOUR_CLIENT_SECRET]&refresh_token=[REPLACE_WITH_YOUR_REFRESH_TOKEN]&grant_type=refresh_token

How it works
DummyActivity.js creates dummy activities at 23:59 with 1 seconds private only visible for  our technical company user.
The GetEnrichedClubActivity script then runs the club activities API as the activities are ordered date is today until it reaches the created dummy activity then the date  is changed.
Acivities is enhanced via calculated properties pace, distance in km etc.


