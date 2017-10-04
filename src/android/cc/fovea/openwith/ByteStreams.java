package cc.fovea.openwith;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Convert an InputStream to a byte array.
 *
 * Sourced from Google guava classes.
 */
public final class ByteStreams {

    /** Throws if the argument is null. */
    public static <T> T checkNotNull(final T reference) {
        if (reference == null) {
            throw new NullPointerException(); // NOPMD
        }
        return reference;
    }

    /** Throws if the argument is false. */
    public static void checkArgument(final boolean expression) {
        if (!expression) {
            throw new IllegalArgumentException();
        }
    }

    /** Throws if the index isn't in [0..size]. */
    public static int checkPositionIndex(final int index, final int size) {
        // Carefully optimized for execution by hotspot (explanatory comment above)
        if (index < 0 || index > size) {
            throw new IndexOutOfBoundsException("invalid index");
        }
        return index;
    }

    /**
     * Creates a new byte array for buffering reads or writes.
     */
    static byte[] createBuffer() {
        return new byte[8192];
    }

    private ByteStreams() {}

    /**
     * Copies all bytes from the input stream to the output stream. Does not close or flush either
     * stream.
     *
     * @param from the input stream to read from
     * @param to the output stream to write to
     * @return the number of bytes copied
     * @throws IOException if an I/O error occurs
     */
    public static long copy(
            final InputStream from,
            final OutputStream to) // NOPMD
            throws IOException {
        checkNotNull(from);
        checkNotNull(to);
        final byte[] buf = createBuffer();
        long total = 0;
        while (true) {
            final int r = from.read(buf); // NOPMD
            if (r == -1) {
                break;
            }
            to.write(buf, 0, r);
            total += r;
        }
        return total;
    }

    /**
     * Reads all bytes from an input stream into a byte array. Does not close the stream.
     *
     * @param in the input stream to read from
     * @return a byte array containing all the bytes from the stream
     * @throws IOException if an I/O error occurs
     */
    public static byte[] toByteArray(
            final InputStream in) // NOPMD
            throws IOException {
        // Presize the ByteArrayOutputStream since we know how large it will need
        // to be, unless that value is less than the default ByteArrayOutputStream
        // size (32).
        final ByteArrayOutputStream out = new ByteArrayOutputStream(
                Math.max(32, in.available()));
        copy(in, out);
        return out.toByteArray();
    }
}
// vim: ts=4:sw=4:et
