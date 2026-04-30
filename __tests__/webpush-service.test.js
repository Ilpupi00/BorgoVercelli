"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
process.env.VAPID_PUBLIC_KEY = 'test-pub';
process.env.VAPID_PRIVATE_KEY = 'test-priv';

const db = require('../src/core/config/database');
const webpush = require('web-push');
const webpushService = require('../src/shared/services/webpush');

jest.mock('../src/core/config/database');
jest.mock('web-push');

describe('WebPush Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loadSubscriptions should return mapped rows', async () => {
        db.query.mockResolvedValue({ 
            rows: [{ 
                endpoint: 'e', 
                p256dh: 'p', 
                auth: 'a', 
                user_id: 1, 
                is_admin: false,
                created_at: new Date(),
                updated_at: new Date()
            }] 
        });
        const res = await webpushService.loadSubscriptions();
        expect(res[0].endpoint).toBe('e');
        expect(res[0].keys.p256dh).toBe('p');
    });

    it('addSubscription should call db.query with UPSERT', async () => {
        const now = new Date();
        db.query.mockResolvedValue({ rows: [{ id: 1, created_at: now, updated_at: now }] });
        const sub = { endpoint: 'e', keys: { p256dh: 'p', auth: 'a' } };
        const res = await webpushService.addSubscription(sub, 1);
        expect(res.id).toBe(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO push_subscriptions'), expect.any(Array));
    });

    it('removeSubscription should call db.query with DELETE', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] });
        await webpushService.removeSubscription('e');
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM push_subscriptions'), ['e']);
    });

    it('sendNotificationToUsers should call webpush.sendNotification', async () => {
        const subs = [{ 
            endpoint: 'e', 
            keys: { p256dh: 'p', auth: 'a' }, 
            userId: 1,
            isAdmin: false 
        }];
        webpush.sendNotification.mockResolvedValue({});
        db.query.mockResolvedValue({ rows: [] }); // For updateSuccessTimestamp
        
        const res = await webpushService.sendNotificationToUsers([1], { title: 'T' }, subs);
        expect(res.sent).toBe(1);
        expect(webpush.sendNotification).toHaveBeenCalled();
    });
});
