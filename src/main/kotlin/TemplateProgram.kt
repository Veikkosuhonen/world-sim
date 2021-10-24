import org.openrndr.application
import org.openrndr.color.ColorRGBa
import org.openrndr.draw.*
import org.openrndr.extra.noise.valueHermite
import org.openrndr.internal.Driver
import org.openrndr.math.Vector2
import org.openrndr.math.Vector3
import java.io.File

fun main() = application {
    configure {
        width = 1280
        height = 720
    }

    program {

        val simulationShader = loadShader("data/screenspace.vert", "data/simulation.frag")
        val imageShader = loadShader("data/screenspace.vert", "data/image.frag")
        val bumpShader = loadShader("data/screenspace.vert", "data/bump.frag")

        val geometry = getQuadGeometry()

        val dataBuffer1 = getDataBuffer(width, height)
        val dataBuffer2 = getDataBuffer(width, height)
        val bumpBuffer = getBumpBuffer(width, height)

        extend {
            val bufferRenderDirection = frameCount % 2 == 0;
            val source = if (bufferRenderDirection) dataBuffer1 else dataBuffer2
            val target = if (bufferRenderDirection) dataBuffer2 else dataBuffer1

            drawer.isolatedWithTarget(target) {
                source.colorBuffer(0).bind(1)
                simulationShader.begin()
                simulationShader.uniform("u_heightmap", 1)
                simulationShader.uniform("u_resolution", width.toFloat(), height.toFloat())
                Driver.instance.drawVertexBuffer(
                    simulationShader,
                    listOf(geometry),
                    DrawPrimitive.TRIANGLE_STRIP,
                    0,
                    geometry.vertexCount
                )
                simulationShader.end()
            }

            drawer.isolatedWithTarget(bumpBuffer) {
                target.colorBuffer(0).bind(1)
                bumpShader.begin()
                bumpShader.uniform("u_heightmap", 1)
                bumpShader.uniform("u_resolution", width.toFloat(), height.toFloat())
                drawer.clear(ColorRGBa.TRANSPARENT)
                Driver.instance.drawVertexBuffer(
                    bumpShader,
                    listOf(geometry),
                    DrawPrimitive.TRIANGLE_STRIP,
                    0,
                    geometry.vertexCount
                )
                bumpShader.end()
            }

            target.colorBuffer(0).bind(1)
            bumpBuffer.colorBuffer(0).bind(2)
            imageShader.begin()
            imageShader.uniform("u_heightmap", 1)
            imageShader.uniform("u_bump", 2)
            imageShader.uniform("u_resolution", width.toFloat(), height.toFloat())
            Driver.instance.drawVertexBuffer(imageShader, listOf(geometry), DrawPrimitive.TRIANGLE_STRIP, 0, geometry.vertexCount)
            imageShader.end()

            drawer.text((1.0 / deltaTime).toString().substring(0..3), 10.0, 10.0)
        }
    }
}

fun getDataBuffer(width: Int, height: Int): RenderTarget {
    val renderTarget = renderTarget(width, height) {
        colorBuffer(type = ColorType.FLOAT32, format = ColorFormat.RGBa)
    }
    val shadow = renderTarget.colorBuffer(0).shadow
    for (y in 0 until height)
        for (x in 0 until width)
            writeToBuffer(x, y, shadow)
    shadow.upload()
    return renderTarget
}

fun writeToBuffer(x: Int, y: Int, buffer: ColorBufferShadow) {
    val height = noise(x, y, 1024, 42)
    buffer[x, y] = ColorRGBa(height, 0.0, 0.0, 1.0)
}

fun getBumpBuffer(width: Int, height: Int): RenderTarget =
    renderTarget(width, height) {
        colorBuffer(type = ColorType.FLOAT32, format = ColorFormat.RGBa)
    }

fun getQuadGeometry(): VertexBuffer {
    val geometry = vertexBuffer(vertexFormat {
        position(3) // -- this attribute is named "position"
    }, 4)

    geometry.put {
        write(Vector3(-1.0, -1.0, 0.0))
        write(Vector3(-1.0, 1.0, 0.0))
        write(Vector3(1.0, -1.0, 0.0))
        write(Vector3(1.0, 1.0, 0.0))
    }

    return geometry
}

fun loadShader(vsPath: String, fsPath: String): Shader {
    return Shader.createFromCode(vsCode = File(vsPath).readText(), fsCode = File(fsPath).readText(), name = fsPath.substring(5))
}

fun noise(x0: Int, y0: Int, n: Int, seed: Int, grain: Double = 0.5): Double {
    val x = x0.toDouble() / n - 39.0
    val y = y0.toDouble() / n + 72.0

    var height = 0.0
    var max = 0.0
    val octaves = 32
    var mag = 1.0
    for (i in 1..octaves) {
        val offset = i * 10.0
        val scale = i * i
        val x1 = x * scale + offset
        val y1 = y * scale - offset
        height += valueHermite(seed, x1, y1) * mag
        max += 0.4 * mag
        mag *= grain
    }
    return (height + max) / (2 * max)
}
