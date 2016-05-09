// Compile with: clang -framework cocoa -o fgwinid fgwinid.m
// Technique from https://github.com/vorgos/QuickGrab/blob/master/quickgrab.m

#import <Cocoa/Cocoa.h>

int main(int argc, char *argv[]) {
  id pool = [NSAutoreleasePool new];

  CFArrayRef windowList = CGWindowListCopyWindowInfo(
    kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements,
    kCGNullWindowID
  );

  for (NSDictionary* entry in (NSArray*) windowList) {
    NSNumber *wnumber = [entry objectForKey: (id) kCGWindowNumber];
    NSNumber *wlevel = [entry objectForKey: (id) kCGWindowLayer];

    if ([wlevel integerValue] == 0) {
      printf("%ld\n", (long) [wnumber integerValue]);
      break;
    }
  }

  [pool drain];
  return 0;
}
