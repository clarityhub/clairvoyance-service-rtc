const chai = require('chai');

const { createToken } = require('service-claire/helpers/tokens');
const { createForgery } = require('service-claire/test/helpers/forgery');

const { expect } = chai;
const { app } = require('../../src/index');

describe('Tokens 1.0', () => {
  describe('POST /rtc/tokens', () => {
    it('creates token for the client', (done) => {
      const token = createToken({
        accountId: '1',
        clientId: '1',
      });

      chai.request(app)
        .post('/rtc/tokens')
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(err).to.be.null;
          expect(resp.status).to.be.equal(200);
          expect(resp.body.token).to.not.be.empty;

          done();
        });
    });

    it('does not create token if the jwt is invalid', (done) => {
      const token = createToken({
        accountId: '1',
        clientId: '1',
      });

      // Forge the token
      const forgery = createForgery(token);

      chai.request(app)
        .post('/rtc/tokens')
        .set({
          'X-Api-Version': '1.0',
          token: forgery,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(403);

          done();
        });
    });

    it('creates a token for the user', (done) => {
      const token = createToken({
        userId: 1,
        email: 'test@test.com',
        name: 'Test McTesterson',
        status: 'active',
        accountId: '1',
      });

      chai.request(app)
        .post('/rtc/tokens')
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(err).to.be.null;
          expect(resp.status).to.be.equal(200);
          expect(resp.body.token).to.not.be.empty;

          done();
        });
    });
  });
});
