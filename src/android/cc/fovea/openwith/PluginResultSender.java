package cc.fovea.openwith;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;

/**
 * Helper methods to reduce the pain while calling javascript callbacks.
 */
@SuppressWarnings("PMD.ShortMethodName")
class PluginResultSender {

    /** Send an INVALID_ACTION error. */
    public static boolean invalidAction(
            final CallbackContext context) {
        final PluginResult result = new PluginResult(PluginResult.Status.INVALID_ACTION);
        context.sendPluginResult(result);
        return false;
    }

    /** Send NO_RESULT.
     * We generally keep the callback for a later call,so this is left as
     * an option to this method. */
    public static boolean noResult(
            final CallbackContext context,
            final boolean keepCallback) {
        final PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
        result.setKeepCallback(keepCallback);
        context.sendPluginResult(result);
        return true;
    }

    /** Send OK. */
    public static boolean ok(
            final CallbackContext context) {
        final PluginResult result = new PluginResult(PluginResult.Status.OK);
        context.sendPluginResult(result);
        return true;
    }
}
// vim: ts=4:sw=4:et
