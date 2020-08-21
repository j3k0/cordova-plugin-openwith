package cc.fovea.openwith;

import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import java.util.Arrays;
import java.util.ArrayList;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
* This is the entry point of the openwith plugin
*
* @author Jean-Christophe Hoelt
*/
public class OpenWithPlugin extends CordovaPlugin {

    /** How the plugin name shows in logs */
    private final String PLUGIN_NAME = "OpenWithPlugin";

    /** Maximal verbosity, log everything */
    private final int DEBUG = 0;
    /** Default verbosity, log interesting stuff only */
    private final int INFO = 10;
    /** Low verbosity, log only warnings and errors  */
    private final int WARN = 20;
    /** Minimal verbosity, log only errors */
    private final int ERROR = 30;

    /** Current verbosity level, changed with setVerbosity */
    private int verbosity = INFO;

    /** Log to the console if verbosity level is greater or equal to level */
    private void log(final int level, final String message) {
        switch(level) {
            case DEBUG: Log.d(PLUGIN_NAME, message); break;
            case INFO: Log.i(PLUGIN_NAME, message); break;
            case WARN: Log.w(PLUGIN_NAME, message); break;
            case ERROR: Log.e(PLUGIN_NAME, message); break;
        }
        if (level >= verbosity && loggerContext != null) {
            final PluginResult result = new PluginResult(
                    PluginResult.Status.OK,
                    String.format("%d:%s", level, message));
            result.setKeepCallback(true);
            loggerContext.sendPluginResult(result);
        }
    }

    /** Callback to the javascript onNewFile method */
    private CallbackContext handlerContext;

    /** Callback to the javascript logger method */
    private CallbackContext loggerContext;

    /** Intents added before the handler has been registered */
    private ArrayList pendingIntents = new ArrayList(); //NOPMD

    /**
     * Called when the WebView does a top-level navigation or refreshes.
     *
     * Plugins should stop any long-running processes and clean up internal state.
     *
     * Does nothing by default.
     */
    @Override
    public void onReset() {
        verbosity = INFO;
        handlerContext = null;
        loggerContext = null;
        pendingIntents.clear();
    }

    /**
     * Generic plugin command executor
     *
     * @param action
     * @param data
     * @param callbackContext
     * @return
     */
    @Override
    public boolean execute(final String action, final JSONArray data, final CallbackContext callbackContext) {
        log(DEBUG, "execute() called with action:" + action + " and options: " + data);
        if ("setVerbosity".equals(action)) {
            return setVerbosity(data, callbackContext);
        }
        else if ("init".equals(action)) {
            return init(data, callbackContext);
        }
        else if ("setHandler".equals(action)) {
            return setHandler(data, callbackContext);
        }
        else if ("setLogger".equals(action)) {
            return setLogger(data, callbackContext);
        }
        else if ("load".equals(action)) {
            return load(data, callbackContext);
        }
        else if ("exit".equals(action)) {
            return exit(data, callbackContext);
        }
        log(DEBUG, "execute() did not recognize this action: " + action);
        return false;
    }

    public boolean setVerbosity(final JSONArray data, final CallbackContext context) {
        log(DEBUG, "setVerbosity() " + data);
        if (data.length() != 1) {
            log(WARN, "setVerbosity() -> invalidAction");
            return false;
        }
        try {
            verbosity = data.getInt(0);
            log(DEBUG, "setVerbosity() -> ok");
            return PluginResultSender.ok(context);
        }
        catch (JSONException ex) {
            log(WARN, "setVerbosity() -> invalidAction");
            return false;
        }
    }

    // Initialize the plugin
    public boolean init(final JSONArray data, final CallbackContext context) {
        log(DEBUG, "init() " + data);
        if (data.length() != 0) {
            log(WARN, "init() -> invalidAction");
            return false;
        }
        onNewIntent(cordova.getActivity().getIntent());
        log(DEBUG, "init() -> ok");
        return PluginResultSender.ok(context);
    }

    // Exit after processing
    public boolean exit(final JSONArray data, final CallbackContext context) {
        log(DEBUG, "exit() " + data);
        if (data.length() != 0) {
            log(WARN, "exit() -> invalidAction");
            return false;
        }
        cordova.getActivity().moveTaskToBack(true);
        log(DEBUG, "exit() -> ok");
        return PluginResultSender.ok(context);
    }

    public boolean setHandler(final JSONArray data, final CallbackContext context) {
        log(DEBUG, "setHandler() " + data);
        if (data.length() != 0) {
            log(WARN, "setHandler() -> invalidAction");
            return false;
        }
        handlerContext = context;
        log(DEBUG, "setHandler() -> ok");
        return PluginResultSender.noResult(context, true);
    }

    public boolean setLogger(final JSONArray data, final CallbackContext context) {
        log(DEBUG, "setLogger() " + data);
        if (data.length() != 0) {
            log(WARN, "setLogger() -> invalidAction");
            return false;
        }
        loggerContext = context;
        log(DEBUG, "setLogger() -> ok");
        return PluginResultSender.noResult(context, true);
    }

    public boolean load(final JSONArray data, final CallbackContext context) {
        log(DEBUG, "load()");
        if (data.length() != 1) {
            log(WARN, "load() -> invalidAction");
            return false;
        }
        final ContentResolver contentResolver = this.cordova
            .getActivity().getApplicationContext().getContentResolver();
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    final JSONObject fileDescriptor = data.getJSONObject(0);
                    final Uri uri = Uri.parse(fileDescriptor.getString("uri"));
                    final String data = Serializer.getDataFromURI(contentResolver, uri);
                    final PluginResult result = new PluginResult(PluginResult.Status.OK, data);
                    context.sendPluginResult(result);
                    log(DEBUG, "load() " + uri + " -> ok");
                }
                catch (JSONException e) {
                    final PluginResult result = new PluginResult(PluginResult.Status.ERROR, e.getMessage());
                    context.sendPluginResult(result);
                    log(DEBUG, "load() -> json error");
                }
            }
        });
        return true;
    }

    /**
     * This is called when a new intent is sent while the app is already opened.
     *
     * We also call it manually with the cordova application intent when the plugin
     * is initialized (so all intents will be managed by this method).
     */
    @Override
    public void onNewIntent(final Intent intent) {
        log(DEBUG, "onNewIntent() " + intent.getAction());
        /**
         * If the activity is not the task root, start a new
         * activity and close this one. By doing this, we
         * enforce the app to run as a singleTask
         */
        if (!cordova.getActivity().isTaskRoot()) {
          cordova.getActivity().startActivity(intent);
          cordova.getActivity().finish();
          return;
        }
        final JSONObject json = toJSONObject(intent);
        if (json != null) {
            pendingIntents.add(json);
        }
        processPendingIntents();
    }

    /**
     * When the handler is defined, call it with all attached files.
     */
    private void processPendingIntents() {
        log(DEBUG, "processPendingIntents()");
        if (handlerContext == null) {
            return;
        }
        for (int i = 0; i < pendingIntents.size(); i++) {
            sendIntentToJavascript((JSONObject) pendingIntents.get(i));
        }
        pendingIntents.clear();
    }

    /** Calls the javascript intent handlers. */
    private void sendIntentToJavascript(final JSONObject intent) {
        final PluginResult result = new PluginResult(PluginResult.Status.OK, intent);
        result.setKeepCallback(true);
        handlerContext.sendPluginResult(result);
    }

    /**
     * Converts an intent to JSON
     */
    private JSONObject toJSONObject(final Intent intent) {
        try {
            final ContentResolver contentResolver = this.cordova
                .getActivity().getApplicationContext().getContentResolver();
            return Serializer.toJSONObject(contentResolver, intent);
        } catch (JSONException e) {
            log(ERROR, "Error converting intent to JSON: " + e.getMessage());
            log(ERROR, Arrays.toString(e.getStackTrace()));
            return null;
        }
    }
}
// vim: ts=4:sw=4:et
