# Hướng Dẫn Tối Ưu API Lấy Thông Tin Game & Cấu Hình

Tài liệu này trình bày lý do tại sao không nên gộp chung query lấy thông tin Game và cấu hình Game (Game Requirements) bằng lệnh SQL `JOIN`, đồng thời đề xuất 2 phương án tối ưu tốt nhất để tăng tốc độ tải trang.

## Vấn Đề Gặp Phải Khi Dùng Lệnh SQL `JOIN`

Mặc dù việc gộp thành 1 API sẽ giúp giảm đi 1 HTTP request, nhưng nếu sử dụng lệnh SQL `JOIN` để nối dữ liệu từ bảng Game với Game Requirements sẽ gây ra **Trùng Lặp Dữ Liệu (Data Redundancy)**.

> [!WARNING]
> Một game thường có nhiều mức cấu hình (VD: **Minimum** và **Recommended**). Khi bạn `JOIN`, Database sẽ trả về 2 dòng kết quả. 
> Toàn bộ các thông tin nặng của Game (như `description` rất dài, `image`, `download_url`, v.v.) sẽ bị lặp lại ở tất cả các dòng, làm lãng phí băng thông mạng từ DB lên Server, cũng như từ Server về Client.

Thay vì gộp bằng SQL, dưới đây là 2 cách tối ưu để giải quyết triệt để vấn đề độ trễ mà không làm tăng kích thước dữ liệu.

---

## Cách A: Tối Ưu Phía Frontend bằng `Promise.all` (Khuyên Dùng)

Hiện tại, ở Frontend (file `game-details.js`), việc gọi API đang bị "nghẽn cổ chai" do gọi tuần tự (chờ API 1 chạy xong mới gọi API 2). Việc chạy song song 2 API này sẽ giúp tiết kiệm tới 50% thời gian chờ tải mạng mà không cần thay đổi bất kì code Backend nào.

**Trước khi tối ưu (Tuần tự):**
```javascript
const response = await fetch(`http://localhost:5000/api/games/${gameId}`);
const result = await response.json();

const reqResponse = await fetch(`http://localhost:5000/api/games/${gameId}/game_requirement`);
const reqResult = await reqResponse.json();
```

**Sau khi tối ưu (Song song):**
```javascript
const [gameRes, reqRes] = await Promise.all([
  fetch(`http://localhost:5000/api/games/${gameId}`),
  fetch(`http://localhost:5000/api/games/${gameId}/game_requirement`)
]);

const result = await gameRes.json();
const reqResult = await reqRes.json();
```

> [!TIP]
> Sử dụng cách này, độ trễ mạng lúc này chỉ phụ thuộc vào request nào tốn nhiều thời gian nhất, thay vì là tổng thời gian của cả 2 request cộng lại.

---

## Cách B: Tối Ưu Phía Backend (Gộp tại tầng Service Node.js)

Nếu bạn bắt buộc muốn Frontend chỉ phải gọi đúng 1 API duy nhất (ví dụ: `/api/games/:id/full-detail`), thì hãy gom dữ liệu tại Backend bằng cách gọi đồng thời 2 Query SQL độc lập thay vì `JOIN`.

Tại file `games.service.js`, bạn có thể viết một hàm mới như sau:

```javascript
const getFullGameDetail = async (game_id) => {
    try {
        const pool = await sql.connect();
        const request = pool.request();
        request.input('game_id', sql.Int, game_id);

        // Chạy song song 2 câu query riêng biệt
        const [gameInfoResult, reqInfoResult] = await Promise.all([
            request.query('SELECT * FROM fn_GetGameDetail(@game_id)'),
            request.query('SELECT * FROM fn_GetGameRequirementByID(@game_id)')
        ]);

        return {
            success: true,
            data: {
                info: gameInfoResult.recordset[0],        // Lấy thông tin game chính
                requirements: reqInfoResult.recordset     // Lấy mảng các cấu hình yêu cầu
            }
        };
    } catch (error) {
        console.error('Error in getFullGameDetail:', error);
        throw new Error('Lỗi khi lấy thông tin chi tiết game đầy đủ');
    }
}
```

> [!NOTE]
> Khi sử dụng phương pháp này, dữ liệu trả về cho Frontend sẽ cực kỳ gọn gàng với dạng cây JSON lồng nhau, rất dễ dàng trong việc map lại dữ liệu lên giao diện. Cả phía Client và Database đều chạy ở hiệu suất tốt nhất.
