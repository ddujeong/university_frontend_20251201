var server = "https://janus.jsflux.co.kr/janus";

var janus = null;
var sfutest = null;
var opaqueId = "videoroomtest-" + Janus.randomString(12);
var iceServers = null;
var myroom = 1234; // Demo room
var isPublishing = false;

if (getQueryStringValue("room") !== "")
  myroom = parseInt(getQueryStringValue("room"));

//  [수정] 자동 접속 로직: myusername을 URL 파라미터 'display'에서 가져옵니다.
var myusername = getQueryStringValue("display");
var myrole = getQueryStringValue("role"); // role은 이제 UI에서만 사용됨
var myid = null;
var mystream = null;
var mypvtid = null;
var feeds = [];
var feedStreams = {};

// [통합] 나(Publisher)를 위한 전용 메시지 처리 함수
function handlePublisherMessage(msg, jsep) {
  Janus.debug(" ::: Got a message (publisher) :::", msg);
  var event = msg["videoroom"];
  Janus.debug("Event: " + event);
  if (event) {
    if (event === "joined") {
      // 입장 성공 로직
      myid = msg["id"];
      mypvtid = msg["private_id"];
      $("#videojoin").hide(); // 참여 UI 숨김
      $("#videos").removeClass("hide").show();
      setTimeout(function() {
    publishOwnFeed(true);
  }, 500);

      if (msg["publishers"]) {
        var list = msg["publishers"];
        for (var f in list) {
          var id = list[f]["id"];
          if (id && id !== myid && findRemoteFeed(id) === null) {
            newRemoteFeed(
              id,
              list[f]["display"],
              list[f]["audio_codec"],
              list[f]["video_codec"]
            );
          }
        }
      }
    } else if (event === "destroyed") {
      // 방 폭파 로직
      Swal.fire({
        icon: "warning",
        title: "연결 종료",
        text: "방장이 회의를 종료했거나 방이 사라졌습니다. 메인 화면으로 돌아갑니다.",
        background: "#1e293b",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "확인",
        allowOutsideClick: false, // 실수로 바깥 눌러서 창 닫히는 것 방지
      }).then((result) => {
        // 사용자가 '확인' 버튼을 누르면 실행됩니다.
        window.location.reload();
      });
    } else if (event === "event") {
      // 이벤트 로직(새 사람 등장/나감 처리)
      if (msg["publishers"]) {
        var list = msg["publishers"];
        for (var f in list) {
          if (
            list[f]["id"] !== myid &&
            findRemoteFeed(list[f]["id"]) === null
          ) {
            newRemoteFeed(
              list[f]["id"],
              list[f]["display"],
              list[f]["audio_codec"],
              list[f]["video_codec"]
            );
          }
        }
      } else if (msg["leaving"] || msg["unpublished"]) {
        // One of the publishers has gone away?
        var leaving = msg["leaving"] || msg["unpublished"];
        Janus.log("Publisher left: " + leaving);

        var remoteFeed = findRemoteFeed(leaving);
        if (remoteFeed && msg["unpublished"]) {
          // 화면 중지 버튼을 누른 경우 -> 아바타 표시
          showPlaceholder(remoteFeed);
        } else if (leaving !== "ok") {
          // 아예 나간 경우 -> 박스 제거
          detachRemoteFeed(leaving);
        }
      } else if (msg["error"]) {
        if (
          msg["error_code"] === 429 &&
          msg["error"] === "Missing mandatory element (feed)"
        ) {
          Janus.warn("Ignoring common subscriber error: " + msg["error"]);
          return;
        }
        if (
          msg["error"] === "Can't unpublish, not published" ||
          msg["error"] === "No such feed" ||
          msg["error"].includes("not found")
        ) {
          Janus.log(
            "의도적인 중단 과정의 에러이므로 무시합니다: " + msg["error"]
          );
          return; // 여기서 함수를 끝내서 아래 Swal.fire가 실행되지 않게 합니다.
        }
        let errorText = msg["error"];

        // 알 수 없는 에러 문구 번역 (선택 사항)
        if (errorText.includes("already exist"))
          errorText = "이미 사용 중인 이름이거나 방 번호입니다.";

        Swal.fire({
          icon: "error",
          title: "서버 응답 오류",
          text: errorText,
          background: "#1e293b",
          color: "#fff",
          confirmButtonColor: "#ef4444", // 에러 강조를 위해 빨간색
          confirmButtonText: "확인",
        });
      }
    }
  }
  if (jsep) {
    Janus.debug("Handling SDP as well...", jsep);
    sfutest.handleRemoteJsep({ jsep: jsep });
    var audio = msg["audio_codec"];
    var video = msg["video_codec"];
    if (mystream && mystream.getAudioTracks().length > 0 && !audio) {
      toastr.warning("오디오 스트림이 거절되었습니다.");
    }
    if (mystream && mystream.getVideoTracks().length > 0 && !video) {
      toastr.warning("비디오 스트림이 거절되었습니다.");
      $("#myvideo").hide();
      $("#videolocal").append(
        '<div class="no-video-container">Video rejected</div>'
      );
    }
  }
}
// 🟢 [추가] 상대방이 방을 나갔을 때 피드를 정리하는 통합 함수
function detachRemoteFeed(leavingId) {
  var remoteFeed = null;
  // 1. 해당 ID를 가진 피드 찾기
  for (var i = 1; i < 6; i++) {
    if (feeds[i] && feeds[i].rfid == leavingId) {
      remoteFeed = feeds[i];
      break;
    }
  }

  // 2. 피드가 존재하면 UI 정리 및 연결 해제
  if (remoteFeed != null) {
    Janus.debug(
      "Feed " +
        remoteFeed.rfid +
        " (" +
        remoteFeed.rfdisplay +
        ") has left, detaching"
    );

    // UI 요소 비우고 숨기기
    $("#remote" + remoteFeed.rfindex)
      .empty()
      .hide();
    $("#videoremote" + remoteFeed.rfindex).empty();

    // 데이터 정리
    feeds[remoteFeed.rfindex] = null;
    remoteFeed.detach();

    // 스트림 관리 객체에서 삭제
    if (feedStreams && feedStreams[remoteFeed.rfid]) {
      delete feedStreams[remoteFeed.rfid];
    }
  }
}

// 🟢 [추가] 상대방 영상(Remote Stream) 화면 처리 함수
function handleRemoteStream(remoteFeed, stream) {
  if ($("#remotevideo" + remoteFeed.rfindex).length === 0) {
    $("#videoremote" + remoteFeed.rfindex).append(
      '<video class="rounded centered" id="remotevideo' +
        remoteFeed.rfindex +
        '" width="100%" height="100%" autoplay playsinline/>'
    );
  }
  if (remoteFeed.rfdisplay) {
    $("#remote" + remoteFeed.rfindex)
      .html(remoteFeed.rfdisplay)
      .removeClass("hide")
      .show();
    $("#videoremote" + remoteFeed.rfindex)
      .closest(".video-box")
      .addClass("show-up");
  }
  Janus.attachMediaStream(
    $("#remotevideo" + remoteFeed.rfindex).get(0),
    stream
  );

  // 비디오 트랙 체크 로직 (보내주신 코드 유지)
  var videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    // 상대방이 카메라 중지 눌렀을 때
    videoTrack.onmute = function () {
      showPlaceholder(remoteFeed);
    };
    // 상대방이 카메라 다시 켰을 때
    videoTrack.onunmute = function () {
      hidePlaceholder(remoteFeed);
    };

    // 만약 들어왔을 때 이미 꺼져있는 상태라면
    if (videoTrack.muted || !videoTrack.enabled) {
      showPlaceholder(remoteFeed);
    }
  }
}
// 아바타 띄우는 함수
function showPlaceholder(remoteFeed) {
  // 1. 비디오 숨기기
  $("#remotevideo" + remoteFeed.rfindex).hide();

  // 2. 이미 아바타가 있으면 지우고 새로 생성 (중복 방지)
  $("#videoremote" + remoteFeed.rfindex + " .video-placeholder").remove();

  // 3. 아바타 HTML 생성
  var firstChar = remoteFeed.rfdisplay ? remoteFeed.rfdisplay.charAt(0) : "?";
  $("#videoremote" + remoteFeed.rfindex).append(
    '<div class="video-placeholder">' +
      '<div class="avatar-circle">' +
      firstChar +
      "</div>" +
      '<div class="placeholder-text">사용자가 화면 송출을 중단했습니다</div>' +
      "</div>"
  );
}

// 아바타 지우고 비디오 보여주는 함수
function hidePlaceholder(remoteFeed) {
  $("#videoremote" + remoteFeed.rfindex + " .video-placeholder").remove();
  $("#remotevideo" + remoteFeed.rfindex).show();
}
// 🟢 [추가] 상대방 피드 정리 함수
function cleanupRemoteFeed(remoteFeed) {
  Janus.log(
    " ::: Got a cleanup notification (remote feed " + remoteFeed.rfid + ") :::"
  );
  if (remoteFeed.spinner) remoteFeed.spinner.stop();
  $("#remotevideo" + remoteFeed.rfindex).remove();
  $("#remote" + remoteFeed.rfindex)
    .empty()
    .hide();
  $("#videoremote" + remoteFeed.rfindex).empty();

  if (remoteFeed.rfindex !== null && remoteFeed.rfindex !== undefined) {
    feeds[remoteFeed.rfindex] = null;
  }
}
// --- [초기화 파트] ---

$(document).ready(function () {
  Janus.init({
    debug: "all",
    dependencies: Janus.useDefaultDependencies(),
    callback: function () {
      if (!Janus.isWebrtcSupported()) {
        alert("WebRTC를 지원하지 않는 브라우저입니다.");
        return;
      }
      const envVars = window.env || {};
      const turnUrl = envVars.REACT_APP_TURN_URL || "turn:54.180.224.186:3478";
      const turnUser = envVars.REACT_APP_TURN_USERNAME || "myuser";
      const turnPass = envVars.REACT_APP_TURN_PASSWORD || "mypassword";
      iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: turnUrl,
          username: turnUser,
          credential: turnPass,
        },
        {
          // turnUrl이 있을 때만 transport=tcp를 붙여 프로토콜 에러 방지
          urls: turnUrl ? (turnUrl.includes("?") ? turnUrl : turnUrl + "?transport=tcp") : [],
          username: turnUser,
          credential: turnPass,
        },
      ];
      console.log("최종 적용된 ICE Servers:", iceServers);
      if (myusername) {
        initJanusSession();
      } else {
        // 수동 접속 UI (이름 입력 등) 처리 로직 필요 시 여기에 구현
        $("#start").click(function () {
          myusername = $("#username").val();
          if (myusername) initJanusSession();
        });
      }
    },
  });
});

// [통합] Janus 세션 생성 및 플러그인 연결 로직
function initJanusSession() {
  if (janus) return;
  janus = new Janus({
    server: server,
    iceServers: iceServers,
    success: function () {
      janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: opaqueId,
        success: function (pluginHandle) {
          sfutest = pluginHandle;
          // 자동 접속 파라미터가 있으면 바로 참여, 없으면 UI 표시
          if (myusername && myroom) {
            autoJoinRoom(myroom, myusername, myrole);
          } else {
            cleanupLocalFeed();
            $("#videojoin").removeClass("hide").show();
          }
        },
        error: function (error) {
          Janus.error(error);
        },
        onmessage: handlePublisherMessage, // 이미 만드신 함수 연결
        onlocalstream: handleLocalStream, // 이미 만드신 함수 연결
        oncleanup: cleanupLocalFeed,
      });
    },
    error: function (error) {
      Janus.error(error);
      Swal.fire("세션 오류", "Janus 세션을 생성할 수 없습니다.", "error");
    },
  });
}

// --- [내 화면(Publisher) 로직] ---
function publishOwnFeed(useAudio) {
  console.log("현재 설정된 iceServers:", iceServers);
  if (isPublishing === true) {
    console.warn("이미 송출 프로세스가 진행 중입니다. 중복 호출을 차단합니다.");
    return;
  }
  isPublishing = true;
  var $btn = $("#publish").length > 0 ? $("#publish") : $("#publish_again");
  $btn
    .attr("disabled", true) // 버튼 클릭 막기
    .css("opacity", "0.6") // 시각적으로 비활성화 표시
    .html('<i class="icon-spin4 animate-spin"></i> 요청 중...'); // 텍스트 변경

  sfutest.createOffer({
    media: { video: true, audio: useAudio, data: true }, // Publishers are always sendonly
    trickle: true,
    success: function (jsep) {
      var publish = { request: "configure", audio: useAudio, video: true };
      sfutest.send({ message: publish, jsep: jsep });
    },
    error: function (error) {
      isPublishing = false;
      $btn.removeAttr("disabled").css("opacity", "1").html("화면 송출 시작");
      console.error("WebRTC createOffer error:", error);
      if (useAudio) {
        publishOwnFeed(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "송출 오류",
         text: "에러 내용: " + (error.message || JSON.stringify(error)),
    footer: "카메라 권한이나 TURN 서버 설정을 확인해주세요."
        });
      }
    },
  });
}

// [통합] 내 영상(Local Stream) 화면에 띄우는 함수
function handleLocalStream(stream) {
  mystream = stream;
  $("#videojoin").hide();
  $("#videos").removeClass("hide").show();
  $("#videolocal").empty();

  $("#videolocal").append(
    '<video class="video-element" id="myvideo" width="100%" height="100%" autoplay playsinline muted="muted"/>' +
      '<div class="video-controls">' +
      '<button class="ctrl-btn btn-mute" id="mute"><i class="icon-mic"></i> <span>음소거</span></button>' +
      '<button class="ctrl-btn btn-stop" id="unpublish"><i class="icon-stop"></i> <span>화면중지</span></button>' +
      "</div>"
  );
  $("#mute").click(toggleMute);
  $("#unpublish").click(unpublishOwnFeed);
  $("#publisher").removeClass("hide").html(myusername).show();
  Janus.attachMediaStream($("#myvideo").get(0), stream);
}

function unpublishOwnFeed() {
  $("#unpublish").attr("disabled", true).html("중지 중...");
  sfutest.send({ message: { request: "unpublish" } });
  sfutest.hangup();
}

function cleanupLocalFeed() {
  mystream = null;
  $("#videolocal")
    .empty()
    .html(
      '<div class="setup-container">' +
        '<div class="setup-icon">🎥</div>' +
        '<button id="publish_again" class="publish-btn">화면 송출 시작</button>' +
        '<p class="setup-text">카메라를 연결하여 대화를 시작하세요</p>' +
        "</div>"
    );
  $("#publish_again")
    .off("click")
    .click(function () {
      publishOwnFeed(true);
    });
}

function toggleMute() {
  var isMuted = sfutest.isAudioMuted();
  var requestAudio = isMuted; // 음소거 상태(true)였으면 audio: true로 요청
  sfutest.send({
    message: { request: "configure", audio: requestAudio },
  });
  if (requestAudio) {
    $("#mute").html('<i class="icon-mic"></i><span>음소거</span>');
  } else {
    $("#mute").html('<i class="icon-mic-off"></i><span>음소거 해제</span>');
  }
}

// --- [상대방(Subscriber) 로직] ---

function newRemoteFeed(id, display, audio, video) {
  var remoteFeed = null;
  janus.attach({
    plugin: "janus.plugin.videoroom",
    opaqueId: opaqueId,
    success: function (pluginHandle) {
      remoteFeed = pluginHandle;
      // [중요] 피드 정보 저장 (상대방 관리를 위해)
      remoteFeed.rfid = id;
      remoteFeed.rfdisplay = display;
      // 빈칸 찾아 저장?
      for (var i = 1; i < 6; i++) {
        if (!feeds[i]) {
          feeds[i] = remoteFeed;
          remoteFeed.rfindex = i;
          break;
        }
      }
      remoteFeed.send({
        message: {
          request: "join",
          room: myroom,
          ptype: "subscriber",
          feed: id,
          private_id: mypvtid,
        },
      });
    },
    onmessage: function (msg, jsep) {
      if (jsep) {
        remoteFeed.createAnswer({
          jsep: jsep,
          media: { audioSend: false, videoSend: false }, // 받는 것만 함
          success: function (jsep) {
            var body = { request: "start", room: myroom };
            remoteFeed.send({ message: body, jsep: jsep });
          },
          error: function (error) {
            Janus.error("WebRTC error:", error);
          },
        });
      }
    },
    onremotestream: function (stream) {
      handleRemoteStream(remoteFeed, stream);
    },
    oncleanup: function () {
      cleanupRemoteFeed(remoteFeed);
    },
  });
}

function getQueryStringValue(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// 🟢 [추가] 이미 구독 중인 피드인지 확인하는 헬퍼 함수
function findRemoteFeed(id) {
  for (var i = 1; i < 6; i++) {
    if (feeds[i] && feeds[i].rfid == id) {
      return feeds[i];
    }
  }
  return null;
}

function autoJoinRoom(roomname, username, role) {
  var roomNumber = parseInt(roomname);
  if (isNaN(roomNumber)) {
    // roomname이 숫자로 변환되지 않은 경우 (예: "SCH1234" 등)
    Janus.error(
      "Invalid Room Number: " + roomname + ". Please check URL parameter."
    );
    Swal.fire({
      icon: "warning",
      title: "방 번호 오류",
      text: "유효하지 않은 방 번호입니다. 링크(URL)를 다시 한번 확인해 주세요.",
      footer:
        '<small style="color: #94a3b8;">입력된 값: ' + roomname + "</small>",
      background: "#1e293b",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
      confirmButtonText: "확인",
    });
    return;
  }

  // 2. Janus VideoRoom에서는 쌍방향 통신을 위해 모든 사용자가 'publisher'로 접속해야 합니다.
  var ptype = "publisher";

  // 5. 방 참여 (Join) 요청 메시지 생성
  var register = {
    request: "join",
    room: roomNumber,
    display: username,
    ptype: ptype, // 핵심: 모든 사용자는 Publisher로 참여
  };

  // 먼저 방 생성을 시도합니다.
  sfutest.send({
    message: {
      request: "create",
      room: roomNumber,
      publishers: 6,
      description: "counseling_room",
    },
    success: function (result) {
  if (isPublishing) return; // 이미 입장 프로세스 중이면 중단
  sfutest.send({ message: register });
},
    error: function (error) {
      // 이미 방이 있는 경우(427 에러 등)에도 무조건 Join 시도
      Janus.log("Room might already exist, attempting to join anyway...");
      sfutest.send({ message: register });
    },
  });
}
// 사용자가 페이지를 떠나거나 새로고침할 때 실행
$(window).on("beforeunload", function () {
  if (janus !== null) {
    // Janus 세션을 파괴하여 서버측 리소스를 즉시 해제합니다.
    janus.destroy();
  }
});
