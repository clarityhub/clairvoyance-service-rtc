const chai = require('chai');
const io = require('socket.io-client');
const InjectInterface = require('service-claire/test/helpers/inject');

const tokensSeeds = require('../../seeders/20170625204828921-create-tokens');
require('../../src/index');

const { expect } = chai;
const socketUrl = 'http://localhost:3001';
const options = {
  transports: ['websocket'],
  'force new connection': true,
  path: '/rtc/socket.io',
};
const usedUUID = '32fd8b05-75e6-4246-aef5-bbb619191692';
const freshUUID = '09c81bff-428e-4732-a6e8-8a6d708a7c53';

describe('Socket 1.0', () => {
  beforeEach((done) => {
    InjectInterface(tokensSeeds.down).then(() => {
      return InjectInterface(tokensSeeds.up).then(() => done());
    }).catch(done);
  });

  describe('Connecting to websocket', () => {
    it('throws an error if connecting without a token', (done) => {
      const socket = io.connect(socketUrl, options);

      socket.on('error', (error) => {
        expect(error.toString()).to.contain('Token not present in query');

        done();
      });
    });

    it('throws an error if connecting with used token', (done) => {
      const socket = io.connect(socketUrl, Object.assign({}, options, {
        query: {
          token: usedUUID,
        },
      }));

      socket.on('error', (error) => {
        expect(error.toString()).to.contain('Could not find token');

        done();
      });
    });

    it('connects with valid token', (done) => {
      const socket = io.connect(socketUrl, Object.assign({}, options, {
        query: {
          token: freshUUID,
        },
      }));

      socket.on('connect', () => {
        done();
      });
    });

    it('does not allow connecting twice with the same token', (done) => {
      const socket = io.connect(socketUrl, Object.assign({}, options, {
        query: {
          token: freshUUID,
        },
      }));

      socket.on('connect', () => {
        const socket2 = io.connect(socketUrl, Object.assign({}, options, {
          query: {
            token: freshUUID,
          },
        }));

        socket2.on('error', (error) => {
          expect(error.toString()).to.contain('Could not find token');

          done();
        });
      });
    });
  });
});
