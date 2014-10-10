== general strategy ==

i've written a handful of functions to gather information about the map and my enemies.  mostly to figure out where they are and to build a pathfinding grid to use with some a* path prediction stuff.

this is the general thinking the ai does each turn.

1. if i'm down to 40% health or less, run to the nearest health well.
1. if i happen to be next to a health well and i'm down in health at all, top it off.
1. establish the nearest health well as sort of my base of operations.
1. check to see if any enemies are within 5 tiles of my new base.
1. if they are moving towards my well, move to intercept their path to the health well.
1. unless they're already there -- we ignore those guys who just sit there and heal.
1. once i find a nearby badguy, i attack him.
1. if there're no badguys, and i'm hurt at all (even a smidge), i just heal up at the health well.
1. and, finally, if i'm healthy and there are no badguys anywhere nearby, i'll just go grab an enemy diamond mine.

the critical part to all of this?  the fact that i intercept enemies on their way to my health well.
