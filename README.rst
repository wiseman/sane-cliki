| Copyright 2011 `John Wiseman`_
| Covered by the MIT License, see `LICENSE.txt`_.


==================
sane-cliki.user.js
==================

This Greasemonkey script is a client-side hack to fix `CLiki`_'s
handling of HTML entities when editing pages.  It also fixes the ALU
wiki (which is running Kiwi, a descendant of CLiki).  Currently CLiki
forgets to encode entities before writing out the source of the page
you're editing into the relevant <TEXTAREA> field.  One consequence of
this is that if you enter "&amp;lt;" into the textarea, then re-edit
the page, you'll see "&lt;".  For more ranting, see my lemonodor post
"`Always with the Fucking Ampersands`_".

Yes, this is a hack that fixes something that should be fixed in the
server software.  But until it is fixed the right way, this may keep
you from pulling your hair out.

The only unusual thing about this script is that I couldn't figure out
how to make it work without making another request to the CLiki/Kiwi
server for the raw source of a page; by the time you ask for the
innerHTML or value property of the relevent TEXTAREA, it's too
late--The browser has realized that the TEXTAREA doesn't contain valid
HTML and has done some crazy information-losing DWIM shit.  The
original page source is no longer accessible via the DOM.  So we hit
the server again.

Other relevant lemonodor posts: "`CLiki Grease`_".

.. _John Wiseman: http://twitter.com/lemonodor
.. _LICENSE.txt: http://github.com/wiseman/sane-cliki/blob/master/LICENSE.txt
.. _CLiki: http://cliki.net/
.. _Always with the Fucking Ampersands: http://lemonodor.com/archives/2005/01/always_with_the.html
.. _CLiki Grease: http://lemonodor.com/archives/2005/05/cliki_grease.html
