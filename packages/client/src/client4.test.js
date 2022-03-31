// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';
import nock from 'nock';

import {ClientError, Client4, HEADER_X_VERSION_ID} from './client4';
import {TelemetryHandler} from './telemetry';

describe('Client4', () => {
    beforeAll(() => {
        if (!nock.isActive()) {
            nock.activate();
        }
    });

    afterAll(() => {
        nock.restore();
    });

    describe('doFetchWithResponse', () => {
        test('serverVersion should be set from response header', async () => {
            const client = new Client4();
            client.setUrl('http://mattermost.example.com');

            expect(client.serverVersion).toEqual('');

            nock(client.getBaseRoute()).
                get('/users/me').
                reply(200, '{}', {[HEADER_X_VERSION_ID]: '5.0.0.5.0.0.abc123'});

            await client.getMe();

            expect(client.serverVersion).toEqual('5.0.0.5.0.0.abc123');

            nock(client.getBaseRoute()).
                get('/users/me').
                reply(200, '{}', {[HEADER_X_VERSION_ID]: '5.3.0.5.3.0.abc123'});

            await client.getMe();

            expect(client.serverVersion).toEqual('5.3.0.5.3.0.abc123');
        });
    });

    describe('fetchWithGraphQL', () => {
        test('Should have correct graphql url', async () => {
            const client = new Client4();
            client.setUrl('http://mattermost.example.com');

            expect(client.getGraphQLUrl).toEqual('http://mattermost.example.com/api/v5/graphql');
        });
    });
});

describe('ClientError', () => {
    test('standard fields should be enumerable', () => {
        const error = new ClientError('https://example.com', {
            message: 'This is a message',
            intl: {
                id: 'test.error',
                defaultMessage: 'This is a message with a translation',
            },
            server_error_id: 'test.app_error',
            status_code: 418,
            url: 'https://example.com/api/v4/error',
        });

        const copy = {...error};

        assert.strictEqual(copy.message, error.message);
        assert.strictEqual(copy.intl, error.intl);
        assert.strictEqual(copy.server_error_id, error.server_error_id);
        assert.strictEqual(copy.status_code, error.status_code);
        assert.strictEqual(copy.url, error.url);
    });
});

describe('trackEvent', () => {
    class TestTelemetryHandler extends TelemetryHandler {
        trackEvent = jest.fn();
        sendPage = jest.fn();
    }

    test('should call the attached RudderTelemetryHandler, if one is attached to Client4', () => {
        const client = new Client4();
        client.setUrl('http://mattermost.example.com');

        expect(client.trackEvent('test', 'onClick')).not.toThrowError();

        const handler = new TestTelemetryHandler();

        client.setTelemetryHandler(handler);
        client.trackEvent('test', 'onClick');

        expect(handler.trackEvent).toHaveBeenCalledTimes(1);
    });
});
