'''
Pinboard : a CSCE 242 project.
Created on May 16, 2012
www.csce242.com

@author: Jose M Vidal <jmvidal@gmail.com>

HW9
'''
import webapp2
import jinja2
import os
import logging #for debugging.
from google.appengine.api import users
from google.appengine.ext import db
import json

jinja_environment = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates"))

class Pin(db.Model):
    imgUrl = db.StringProperty(required=True)
    caption = db.StringProperty(indexed=False)
    date = db.DateTimeProperty(auto_now_add=True)
    owner = db.UserProperty(required=True)
    private = db.BooleanProperty(default=False)
    boards = db.ListProperty(db.Key,default=[]) #references to the boards this pin is in, some might not exist anymore

    def id(self):
        return self.key().id()

    @staticmethod #just like a Java static method
    def getPin(num): 
        """Returns the pin with the given num (a String), or None if there is no such num."""
        try:
            key = db.Key.from_path('Pin', long(num))
            thePin = db.get(key)
            return thePin
        except ValueError:
            return None
        
    
    def getDict(self):
        """Returns a dictionary representation of parts of this pin."""
        return {'imgUrl': self.imgUrl, 'pinid': self.id(), 'caption': self.caption, 'private': self.private}
    
    def remove(self):
        for b in self.boards:
            theBoard = Board.get(b) 
            theBoard.pins.remove(self.key())
            theBoard.put()
        self.delete()
    
class Board(db.Model):
    title = db.StringProperty(required=True)
    owner = db.UserProperty(required=True)
    private = db.BooleanProperty(default=False)
    pins = db.ListProperty(db.Key,default=[]) #references to the pins in this pinboard, some might not exist anymore
    pinsx = db.ListProperty(int)
    pinsy = db.ListProperty(int)
    
    def id(self):
        return self.key().id()
    
    def addPin(self,pin):
        """Adds pin to pins, and this board to that pin's boards. Note that you still need to do 
        a self.put() and pin.put() after calling this!"""
        if (not pin.key() in self.pins):
            self.pins.append(pin.key())
            pin.boards.append(self.key())
            self.pinsx.append(0)
            self.pinsy.append(0)
    
    def deletePin(self,pin):
        """Deletes pin from this board's pins,and this board from pin's boards list."""
        if (pin.key() in self.pins):
            self.pins.remove(pin.key())
            self.idx = pin.boards.index(self.key())
            pin.boards.remove(self.key())
            del pin.boards.pinsx[self.idx]
            del pin.boards.pinsy[self.idx]
            
    def remove(self):
        """Deletes this board, and removes it from all the pins that have it."""
        for p in self.pins:
            thepin = Pin.get(p)
            thepin.boards.remove(self.key())
            thepin.put()
        self.delete()
        
    def updatePin(self,pin,x,y):
        """Updates the x,y coordinates of pin"""
        try:
            i = self.pins.index(pin.key())
            self.pinsx[i] = int(x)
            self.pinsy[i] = int(y)
            return True            
        except ValueError:
            return False

    @staticmethod    
    def getBoard(num):
        """Returns the board with the given num (a String), or None if there is no such num."""
        try:
            key = db.Key.from_path('Board', long(num))
            theBoard = db.get(key)
            return theBoard
        except ValueError:
            return None

    def getPins(self,theUser):
        """Returns this board's pins, that theUser can see."""
        boardPins = []
        for p in self.pins:
            thePin = Pin.get(p)
            if not thePin.private or thePin.owner == theUser: #only my pins, or public 
                boardPins.append(thePin)
        return boardPins    
    
    def getDict(self, theUser):
        """Returns a dictionary representation of parts of this board."""
        b = {'title': self.title, 'private': self.private, 'boardid': self.id()}
        self.i = 0        
        thePins = self.getPins(theUser)
        if (len(self.pinsx) < len(thePins)): #set them all to 0 if not there, so we can be backward-compatible
            self.pinsx = [0 for _ in range(len(thePins))]
        if (len(self.pinsy) < len(thePins)):
            self.pinsy = [0 for _ in range(len(thePins))]
        logging.error(thePins)            
        logging.error(self.pinsx)            
        logging.error(self.pinsy)
        newPins = []            
        for (pin,x,y) in zip(thePins,self.pinsx,self.pinsy):
            jpin = pin.getDict()
            logging.error('Hi there')
            jpin['x'] = x
            jpin['y'] = y
            newPins.append(jpin)
        b['pins'] = newPins
        return b
    
class MyHandler(webapp2.RequestHandler):
    "Setup self.user and self.templateValues values."
    def setupUser(self):
        self.user = users.get_current_user()
        self.templateValues = {}
        if self.user:
            self.templateValues['logout'] = users.create_logout_url('/')
            self.templateValues['username'] = self.user.nickname()
        else:
            self.templateValues['login'] = users.create_login_url('/')
            
    def render(self, afile):
        "Render the given file"
        template = jinja_environment.get_template(afile)
        self.response.out.write(template.render(self.templateValues))
        
    def getIDfmt(self,idstring):
        end = idstring[-5:]
        start = idstring[:-5]
        if end == ".json":
            return (start, "json") #a tuple: ("6", "json")
        if end == ".html":
            return (start, "html")
        fmt = self.request.get('fmt') 
        if fmt != 'json':
            fmt = 'html'
        return (idstring, fmt)

class MainPageHandler(MyHandler):
    def get(self): #/ Ask user to login or show him links
        self.setupUser()
        if self.user:
            self.templateValues['user'] = self.user
        self.templateValues['title'] = 'Pinboard'
        self.render('main.html')
        
        
class PinHandler(MyHandler):
    def get(self,num):
        self.setupUser()
        (num, returnType) = self.getIDfmt(num)    
        logging.info('id is=%s' % num)
        logging.info('returnType=%s' % returnType)
        if num == '': # GET /pin returns the list of pins for this user/ 
            query = Pin.all().filter('owner =', self.user) #Remember: "owner=" won't work!!!
            if returnType == 'json':
                pins = [pin.getDict() for pin in query]
                self.response.headers["Content-Type"] = "text/json"
                self.response.out.write(json.dumps(pins))
                return                
            else: #return html
                self.templateValues['pins'] = query
                self.templateValues['title'] = 'Your Pins'
                self.render('pinlist.html')
                return
        thePin = Pin.getPin(num)
        if thePin == None:
            self.redirect('/') 
            return
        if (not thePin.private) or self.user == thePin.owner:
            if self.user == thePin.owner:
                self.templateValues['editor'] = True
            if returnType == 'json':
                self.response.headers["Content-Type"] = "text/json"
                self.response.out.write(json.dumps(thePin.getDict()))
                return
            else: #return html
                self.templateValues['pin'] = thePin
                self.templateValues['id'] = num
                self.templateValues['title'] = num
                theBoards = []
                for p in thePin.boards:
                    theBoards.append(Board.get(p))
                self.templateValues['boards'] = theBoards
                self.render('pin.html')
            
        else:
            self.redirect('/')
    
    def post(self,num):
        """If /pin/ then create a new one, if /pin/123 then update it,
        if /pin/123?cmd=delete then delete it."""
#        self.error(500)
#        return
        self.setupUser()
        imgUrl = self.request.get('imgUrl')
        caption = self.request.get('caption')
        command = self.request.get('cmd')
        private = self.request.get('private')
        private = True if (private == "on") else False
        xhr = self.request.get('xhr') #true if this is an xhr call 
        owner = self.user
        if num == '': #new pin, create it
            thePin = Pin(imgUrl = imgUrl, caption = caption, owner = owner, private = private)
            thePin.put()
        else:
            thePin = Pin.getPin(num)
            if thePin == None:
                self.redirect('/')  
                return            
            if thePin.owner != self.user: #not his pin, kick him out.
                self.redirect('/')
                return
            if command == 'delete': #delete the pin
                thePin.remove()
                self.redirect('/pin/')            
                return
            else: #existing pin, update it 
                thePin.imgUrl = imgUrl
                thePin.caption = caption
                thePin.private = private
                thePin.put()
        if not xhr:
            key = thePin.key()
            newUrl = '/pin/%s' % key.id()
            logging.info('Going to ' + newUrl)
            self.redirect(newUrl)

class BoardHandler(MyHandler):
    def get(self,num): #/board/
        self.setupUser()
        (num, returnType) = self.getIDfmt(num)        
        if num == '': # GET /board returns the list of pins for this user
            if self.user == None:
                self.redirect('/')
                return
            query = Board.all().filter('owner =', self.user) #Remember: "owner=" won't work!!!
            self.templateValues['boards'] = query
            self.templateValues['title'] = 'Your Boards'
            self.render('boardlist.html')
            return        
        theBoard = Board.getBoard(num)
        if theBoard == None: 
            self.redirect('/') 
            return        
        if (not theBoard.private) or self.user == theBoard.owner:
            self.templateValues['board'] = theBoard
            self.templateValues['id'] = num
            self.templateValues['title'] = num
            if self.user == theBoard.owner:
                self.templateValues['editor'] = True
            myPins = Pin.all().filter('owner =', self.user)            
            self.templateValues['myPins'] = myPins
            boardPins = theBoard.getPins(self.user)
            for p in theBoard.pins:
                thePin = Pin.get(p)
                if not thePin.private or thePin.owner == self.user: #only my pins, or public 
                    boardPins.append(thePin)
            if returnType == "json":
                self.response.headers["Content-Type"] = "text/json"
                self.response.out.write(json.dumps(theBoard.getDict(self.user)))
                return
            #return type is html
            self.templateValues['boardPins']= boardPins
            self.render('board.html')
        else:
            self.redirect('/')
    
    def post(self,num):
#        self.error(500)
#        return
        self.setupUser()
        title = self.request.get('title')
        command = self.request.get('cmd')
        private = self.request.get('private')
        private = True if (private == "true") else False
        owner = self.user
        if num == '': #new board, create it
            theBoard = Board(title = title, owner = owner, private = private)
            theBoard.put()
            key = theBoard.key()
            newUrl = '/board/%s' % key.id()
            self.redirect(newUrl)
            return
        else: #update existing board
            theBoard = Board.getBoard(num)
            if theBoard == None:
                self.redirect('/')  
                return            
            if theBoard.owner != self.user: #not his board, kick him out.
                self.redirect('/')
                return
            if command == 'delete': #delete the board
                theBoard.remove()
                self.redirect('/board/')            
                return
            else: 
                pinToAdd = self.request.get('addPin')
                logging.info('pintoadd=%s=' % pinToAdd)
                if pinToAdd != None and pinToAdd != '' and pinToAdd != 'none':
                    logging.info('adding pin') 
                    thePin = Pin.getPin(pinToAdd) #only add pin if it exists and its mine and its not already in.
                    if thePin != None and thePin.owner == self.user and not (thePin.key() in theBoard.pins):
                        theBoard.addPin(thePin)
                        thePin.put() #needed because addPin changes the pin
                pinToDelete = self.request.get('deletePin')
                if pinToDelete != None and pinToDelete != '' and pinToDelete != 'none': #delete a pin
                    logging.info('deleting pin')  
                    thePin = Pin.getPin(pinToDelete) 
                    if thePin != None and thePin.owner == self.user and (thePin.key() in theBoard.pins):
                        theBoard.deletePin(thePin)
                        thePin.put()
                pinToEdit = self.request.get('editPin')
                if pinToEdit != None and pinToEdit != '' and pinToEdit != 'none': #change the pin's x,y in this board
                    logging.info('editing pin')  
                    thePin = Pin.getPin(pinToEdit) 
                    if thePin != None and thePin.owner == self.user and (thePin.key() in theBoard.pins):
                        x = self.request.get('x')
                        y = self.request.get('y')
                        theBoard.updatePin(thePin,x,y)
                theBoard.title = title
                theBoard.private = private
                theBoard.put()


class CanvasHandler(MyHandler):
    def get(self,num): #/canvas/
        self.setupUser()
        (num, returnType) = self.getIDfmt(num)        
        if num == '': # GET /canvas/ is ignored
            self.redirect('/')
            return
        theBoard = Board.getBoard(num)
        if theBoard == None: 
            self.redirect('/') 
            return        
        if (not theBoard.private) or self.user == theBoard.owner:
            self.templateValues['board'] = theBoard
            self.templateValues['id'] = num
            self.templateValues['title'] = num
            if self.user == theBoard.owner:
                self.templateValues['editor'] = True
            self.render('canvas.html')
        else:
            self.redirect('/')


app = webapp2.WSGIApplication([('/pin/(.*)', PinHandler), ('/pin()', PinHandler),
                               ('/board/(.*)', BoardHandler), ('/board()', BoardHandler), 
                               ('/canvas/(.*)', CanvasHandler), 
                               ('/', MainPageHandler)],
                              debug=True)
