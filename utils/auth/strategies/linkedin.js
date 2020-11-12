const passport = require('passport');
const axios = require('axios');
const boom = require('@hapi/boom');
const { Strategy: LinkedInStrategy } = require('passport-linkedin-oauth2');

const { config } = require('../../../config');

passport.use(
  new LinkedInStrategy(
    {
      clientID: config.linkedinKey,
      clientSecret: config.linkedinSecret,
      callbackURL: '/auth/linkedin/callback',
      // scope: ['r_emailaddress', 'r_liteprofile'],
    },
    async function (accessToken, refreshToken, profile, done) {
      const email = profile.email
        ? profile.email
        : `${profile.id}@linkedin.com`;

      const { data, status } = await axios({
        url: `${config.apiUrl}/api/auth/sign-provider`,
        method: 'post',
        data: {
          name: profile.displayName,
          email: email,
          password: profile.id,
          apiKeyToken: config.apiKeyToken,
        },
      });

      if (!data || status !== 200) return done(boom.unauthorized(), null);

      return done(null, data);
    }
  )
);
