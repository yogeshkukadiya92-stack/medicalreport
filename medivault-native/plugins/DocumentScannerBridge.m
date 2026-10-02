#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DocumentScanner, NSObject)

RCT_EXTERN_METHOD(scan:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(enhanceImage:(NSString *)uri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(previewRemoteFile:(NSString *)url
                  token:(NSString *)token
                  fileName:(NSString *)fileName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
