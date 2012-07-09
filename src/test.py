'''
Created on Jun 10, 2012

@author: jmvidal <jmvidal@gmail.com>

An example of how to use unittest, testbed and webtest together to test our app.
To run these test just run runtests.py, but you must first install the testing packages

These testing packages (unittest, webtest, testbed) are explained at
https://developers.google.com/appengine/docs/python/tools/localunittesting
https://developers.google.com/appengine/docs/python/tools/handlertesting

These tests do not require us to run the dev_appserver. They implement stubs that simulate
the various appengine services.
'''

import unittest
from google.appengine.api import memcache
from google.appengine.ext import db
from google.appengine.ext import testbed
import webtest
import os
import pinboard

class AppTest(unittest.TestCase):
    def setUp(self):
    
        self.testbed = testbed.Testbed()
        # Then activate the testbed, which prepares the service stubs for use.
        self.testbed.activate()
        # Next, declare which service stubs you want to use.
        self.testbed.init_datastore_v3_stub()
        self.testbed.init_user_stub()
        self.testapp = webtest.TestApp(pinboard.app)

    def tearDown(self):
        self.testbed.deactivate()    
    
    def login(self):
        self.testbed.setup_env(
                               USER_EMAIL = 'test@example.com',
                               USER_ID = '123',
                               USER_IS_ADMIN = '0',
                               overwrite = True)
        
    def logout(self):        
        self.testbed.setup_env(
                               USER_EMAIL = '',
                               USER_ID = '',
                               USER_IS_ADMIN = '0',
                               overwrite = True)
        
    def testAnonymousUser(self):
        self.logout()
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        #anonymous gets a login messagex`
        self.assertTrue("login" in response, "No login message")

    def testPrivatePin(self):
        self.login()
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        self.assertTrue("My Pins" in response, "Don't see 'My Pins' after logging in.")
        #post a private pin
        resp = self.testapp.post('/pin', {'imgUrl': "/pic/1.jpeg", 'caption':'the caption', 'private': 'on'})
        pinUrl =  resp.headers['Location']
        response = self.testapp.get(pinUrl)
        #make sure I can see it
        self.assertEqual(response.status_int, 200)
        #logout
        self.logout()
        #make sure anonymous cannot see it
        response = self.testapp.get(pinUrl)
        self.assertEqual(response.status_int, 302)
        
    def testMakeBoard(self):
        self.login()
        resp = self.testapp.post('/board', {'title': "Steampunk Collection"})
        self.assertEqual(resp.status_int, 302)        
        boardUrl =  resp.headers['Location']
        resp = self.testapp.get(boardUrl)
        self.assertTrue("Steampunk" in resp, "Board was not created")

if __name__ == '__main__':
    unittest.main()
