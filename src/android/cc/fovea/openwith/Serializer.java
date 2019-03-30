package cc.fovea.openwith;

import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import java.io.IOException;
import java.io.InputStream;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Handle serialization of Android objects ready to be sent to javascript.
 */
class Serializer {

    /** Convert an intent to JSON.
     *
     * This actually only exports stuff necessary to see file content
     * (streams or clip data) sent with the intent.
     * If none are specified, null is return.
     */
    public static JSONObject toJSONObject(
            final ContentResolver contentResolver,
            final Intent intent)
            throws JSONException {
        JSONArray items = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            items = itemsFromClipData(contentResolver, intent.getClipData());
        }
        if (items == null || items.length() == 0) {
            items = itemsFromExtras(contentResolver, intent.getExtras());
        }
        if (items == null || items.length() == 0) {
            items = itemsFromData(contentResolver, intent.getData());
        }
        if (items == null) {
            return null;
        }
        final JSONObject action = new JSONObject();
        action.put("action", translateAction(intent.getAction()));
        action.put("exit", readExitOnSent(intent.getExtras()));
        action.put("items", items);
        return action;
    }

    public static String translateAction(final String action) {
        if ("android.intent.action.SEND".equals(action) ||
            "android.intent.action.SEND_MULTIPLE".equals(action)) {
            return "SEND";
        } else if ("android.intent.action.VIEW".equals(action)) {
            return "VIEW";
        }
        return action;
    }

    /** Read the value of "exit_on_sent" in the intent's extra.
     *
     * Defaults to false. */
    public static boolean readExitOnSent(final Bundle extras) {
        if (extras == null) {
            return false;
        }
        return extras.getBoolean("exit_on_sent", false);
    }

    /** Extract the list of items from clip data (if available).
     *
     * Defaults to null. */
    public static JSONArray itemsFromClipData(
            final ContentResolver contentResolver,
            final ClipData clipData)
            throws JSONException {
        if (clipData != null) {
            final int clipItemCount = clipData.getItemCount();
            JSONObject[] items = new JSONObject[clipItemCount];
            for (int i = 0; i < clipItemCount; i++) {
                if (clipData.getItemAt(i).getUri() != null) {
                    items[i] = toJSONObject(contentResolver, clipData.getItemAt(i).getUri());
                } else if (clipData.getItemAt(i).getText() != null) {
                    items[i] = toJSONObject(contentResolver, clipData.getItemAt(i).getText().toString());
                } else if (clipData.getItemAt(i).getHtmlText() != null) {
                    items[i] = toJSONObject(contentResolver, clipData.getItemAt(i).getHtmlText());
                } else {
                    items[i] = toJSONObject(contentResolver, clipData.getItemAt(i).toString());
                }
            }
            return new JSONArray(items);
        }
        return null;
    }

    /** Extract the list of items from the intent's extra stream.
     *
     * See Intent.EXTRA_STREAM for details. */
    public static JSONArray itemsFromExtras(
            final ContentResolver contentResolver,
            final Bundle extras)
            throws JSONException {
        if (extras == null) {
            return null;
        }
        final JSONObject item = toJSONObject(
                contentResolver,
                (Uri) extras.get(Intent.EXTRA_STREAM));
        if (item == null) {
            return null;
        }
        final JSONObject[] items = new JSONObject[1];
        items[0] = item;
        return new JSONArray(items);
    }

    /** Extract the list of items from the intent's getData
     *
     * See Intent.ACTION_VIEW for details. */
    public static JSONArray itemsFromData(
            final ContentResolver contentResolver,
            final Uri uri)
            throws JSONException {
        if (uri == null) {
            return null;
        }
        final JSONObject item = toJSONObject(
                contentResolver,
                uri);
        if (item == null) {
            return null;
        }
        final JSONObject[] items = new JSONObject[1];
        items[0] = item;
        return new JSONArray(items);
    }

    /** Convert an Uri to JSON object.
     *
     * Object will include:
     *    "type" of data;
     *    "uri" itself;
     *    "path" to the file, if applicable.
     *    "data" for the file.
     */
    public static JSONObject toJSONObject(
            final ContentResolver contentResolver,
            final Uri uri)
            throws JSONException {
        if (uri == null) {
            return null;
        }
        final JSONObject json = new JSONObject();
        final String type = contentResolver.getType(uri);
        json.put("type", type);
        json.put("uri", uri);
        json.put("path", getRealPathFromURI(contentResolver, uri));
        return json;
    }

    /** Convert an String to JSON object.
     *
     * Object will include:
     *    "type" of data;
     *    "text" itself;
     *    "path" to the file, if applicable.
     *    "data" for the file.
     */
    public static JSONObject toJSONObject(
            final ContentResolver contentResolver,
            final String text)
            throws JSONException {
        if (text == null) {
            return null;
        }
        final JSONObject json = new JSONObject();
        json.put("type", "text/plain");
        json.put("text", text);
        return json;
    }

    /** Return data contained at a given Uri as Base64. Defaults to null. */
    public static String getDataFromURI(
            final ContentResolver contentResolver,
            final Uri uri) {
        try {
            final InputStream inputStream = contentResolver.openInputStream(uri);
            final byte[] bytes = ByteStreams.toByteArray(inputStream);
            return Base64.encodeToString(bytes, Base64.NO_WRAP);
        }
        catch (IOException e) {
            return "";
        }
    }

	/** Convert the Uri to the direct file system path of the image file.
     *
     * source: https://stackoverflow.com/questions/20067508/get-real-path-from-uri-android-kitkat-new-storage-access-framework/20402190?noredirect=1#comment30507493_20402190 */
	public static String getRealPathFromURI(
            final ContentResolver contentResolver,
            final Uri uri) {
		final String[] proj = { MediaStore.Images.Media.DATA };
		final Cursor cursor = contentResolver.query(uri, proj, null, null, null);
		if (cursor == null) {
			return "";
		}
		final int column_index = cursor.getColumnIndex(MediaStore.Images.Media.DATA);
		if (column_index < 0) {
			cursor.close();
			return "";
		}
		cursor.moveToFirst();
		final String result = cursor.getString(column_index);
		cursor.close();
		return result;
	}
}
// vim: ts=4:sw=4:et
