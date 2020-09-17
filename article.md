# Celeste Binary Maps Format
This document is an explanation of how Celeste stores its maps in a binary format. The format is elegant, efficient and easy to understand. Heck, you can even use it if you want to create a levels editor for your own game!
Remember that this document explains **both** the binary format **and** the maps format: After reading this, you should understand how to use this specific binary format to store stuff and also understand how to read/write Celeste maps.

# The Binary Format
During this section I will assume that you're a little bit familiar with .NET's System.IO.BinaryReader/BinaryWriter, or at the very least familiar with the different data types and their binary equivalents.
If you are, skip to Strings Lookup.
If you're not, here are all the data types I'm going to talk about and how they're stored in binary, keep in mind that most of the data is stored in Little Endian and if you don't know what that means, just keep it in mind:
- System.Byte: The regular old byte. Unlike you might think, a byte is different from the byte stored on that disk. Using BinaryReader.ReadByte() can give a different output than reading a byte directly from the stream. Keep that in mind when writing your own format reader.
Stored as a single byte.
- System.Boolean: Stored as one byte: 0 if false, and 1 otherwise.
- System.Int16: AKA a short, stored as 2 bytes hence the name (16-bit)
- System.Int32: AKA an integer, stored as 4 bytes hence the name (32-bit)
- System.Int64: AKA a long, stored as 8 bytes hence the name (64-bit)
- System.Single: AKA a float, or a single-precision floating-point number, stored as 4 bytes.
- System.Double: AKA a double-precision floating-point number, stored as, you guessed it, 8 bytes.
- System.Char: A single character, stored as a single byte representing the character's code on the ASCII/Unicode table (or other, depending on the encoding you use)
- System.String: This is where it gets a bit complicated, the string is stored as a compressed 7-bit integer (that I have no idea how it works) containing its length, and then a chain of bytes each representing a character of the string. It sounds easy on the surface but its a bit of a challenge to parse the 7-bit compressed integer in a different language like Node.JS, here's some JavaScript "example" code that can help you on that (its up to you to implement it):

        var num1 = 0;
		var num2 = 0;
		var b;
		
		do {
			if (num2 == 35) {
				throw new RangeError("Bad 7-bit integer");
			}
			b = this.readByte();
			num1 |= (b & 0x7F) << num2;
			num2 += 7;
		} while ((b & 0x80) != 0);
		
		// At this point, num1 equals the result integer
While there are more data types to store and read, these are the ones that I will talk about in this section, I'll leave it up to you to figure out the rest ;)

## Header/Metadata
At the start of the file you can write extra data, for instance you can write a specific string for your levels your reader can recognize and understand that the file its reading is a level.
I strongly recommend you write global metadata here rather than in an element as its faster and reduces the file's size.

## Strings lookup
The format stores a "lookup" array of strings that contains some frequently used strings. This is purely to increase efficiency and to reduce the file's size. The lookup is usually located at the start of the document after some metadata and contains the strings and their indexes.
The lookup is stored like this:
 - A short representing how many strings the lookup has (lets call it N)
 - N strings next to each other
To retrieve a specific string later on, a zero-based index of the string is provided so you should only worry about keeping the lookup array in your code so that you can access the given index later on. I will call that index a "lookup index" from now on.
Remember that using a lookup index works the exact same way as using a string, so wherever a lookup index is specified, you can replace it with a normal string (if you want to, using lookup indexes is way more efficient).

## Length-Encoded Strings
The format uses length-encoded strings to encode long strings with repetitive characters, merely to reduce the file's size. For instance, the string "aaaaabbbbbccccccc" can be much shorter written as "a5b5c7" or "5a5b7c".
Don't use this for any string, this can make a string twice as long if no characters repeat in a row, so be careful with which strings you encode.
A length-encoded string is stored as:
- A short representing how many bytes to expect when reading
- For each repeating character:
-- A byte representing how many times the character repeats.
-- A byte representing the character itself.

The short at the start includes the count of both bytes (the character byte and the repeating byte), so if you're using a for loop make sure to iterate through the bytes two by two.

## Encoded Values
The format uses an encoded value to store an otherwise unpredictable data type. An encoded value is stored as:
- A byte representing the value's type. You can define your own set of types and their representing byte but I recommend this set (this is compatible with the set Celeste uses, and is not the exact same, more on that in the Celeste section):
-- 0: A boolean
-- 1: A byte
-- 2: A short
-- 3: An int
-- 4: A float
-- 5: A lookup index
-- 6: A string
-- 7: A length-encoded string
-- 8: A long
-- 9: A double
- The value itself, now that you know its type you can simply read it

## Elements
The format uses the concept of elements. Elements are very similar to XML elements, they have a name, a bunch of attributes and some child elements.
Elements are stored like this:
- A lookup index for the element's name
- A byte representing the element's attributes count
- The attributes, where each one is stored as:
-- A lookup index for the attribute's name
-- An encoded value (see Encoded Values)
- A short representing the element's children count
-  Child elements, each one stored in the same way.

Best way to go about parsing elements is a recursive approach so that you have a method that reads an element and calls itself for each child element.


# The Maps Format
Now that you understand how the binary format works, you can proceed with understand how the Celeste maps format works!

Celeste stores a string at the start of the file, the string is constant and always is "CELESTE MAPS" in capital form. This is like the header for the file that can be used to tell if the file is a Celeste map or not.
Then, Celeste stores the map's package name (remember what I said in the header/metadata section?)
After the header, Celeste stores its strings lookup.
Next, the root element, it has no attributes so you can just read the attributes count byte and ignore it (it will always be 0, you can actually check for that and throw an error if not, or just read the invalid attributes and ignore them, all works). As for its child elements, there are three:
- A "Filler" element, has no attributes and contains a bunch of "rect" elements each representing a filler, with the following attributes:
-- x: The horizontal position of the filler
-- y: The vertical position of the filler
-- w: The width of the filler
-- h: The height of the filler
- A "Style" element, with no attributes. I will skip this element for now since at the time being, I don't really understand it and I don't want to provide invalid information, sorry!
- A "levels" element, has no attributes and contains a list of the map's screens ("level" elements, more on that in the next section).

## Notes
- Everything from now on is very WIP and incomplete, and some information are pure assumptions based on my understanding. Do not fully trust anything.
- Attributes that I don't understand have a \* after their names
- Music IDs in general are something like event:/music/level/track
Level could be a level like lvl2 for the Old Site but also could be something like "menu"
Track is the music name itself, for instance "chase"
Example: event:/music/lvl2/chase

## The Level Element
A level element is probably the most important in a map, it is a detailed explanation of every screen in the map.

It has a set of attributes, which are as follows:
- name: The screen's name, this is only to help with the map editing and has no impact on the level, Ahorn users will understand what I mean
- width: The screen's width in pixels, if you want it in tiles divide by 8
- height: The screen's height in pixels, if you want it in tiles divide by 8
- x: The screen's horizontal position in pixels, if you want it in tiles divide by 8
- y: The screen's vertical position in pixels, if you want it in tiles divide by 8
- cameraOffsetX: The amount of pixels the camera will be translated horizontally
- cameraOffsetY: The amount of pixels the camera will be translated vertically
- music\*: A string representing the ID of the music used in the screen (more on that coming soon, music banks are quite a bit complicated to explain)
- alt_music\*: Same as music but I don't know how does it impact the map
- ambience*: A string representing the ID of the ambience.
- musicLayer1/2/3/4: For each one a boolean representing the state of the according music layer (Enabled/Disabled), all the layers will keep playing even if muted, so that all the layers keep in sync.
- musicProgress\*: A string representing the progress of the music. *Yeah, you're welcome, explanations*.
- ambienceProgress*: Same as musicProgress but for the ambience.
- whisper: A boolean representing whether the whisper layer is enabled (like in the Mirror Temple A-Side)
- disableDownTransition: A boolean representing whether the player can transition downwards (true means the player will die, false means the player can transition to a room below)
- c: A number representing the color of the screen (you can see that in the debug map editor, more on that soon as well)
- space: A boolean representing whether the room is in space (float-y physics and you can warp from the bottom to the top and vice versa, like in the Core A-Side's final room)
- dark: A boolean representing whether the room is dark (doesn't have global lighting, like in the Mirror Temple A-Side)
- underwater: A boolean representing whether the room is filled with water (to my knowledge never used in the game)
- windPattern: A string representing the pattern of the wind in the screen, can be one of:
-- None
-- Left
-- Right
-- Down
-- Up
-- Space
-- LeftStrong
-- RightStrong
-- LeftOnOff
-- RightOnOff
-- LeftOnOffFast
-- RightOnOffFast
-- RightCrazy
-- LeftGemsOnly
-- Alternating